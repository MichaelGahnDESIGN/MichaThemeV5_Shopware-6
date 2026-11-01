<?php

declare(strict_types=1);

namespace MichaThemeV5\Demo;

/**
 * Legt die Demo-Artikel (demo-data/products.json) über einen DemoStore an und entfernt sie wieder.
 * Alle IDs sind fest aus Schlüsseln abgeleitet: ein zweiter Import überschreibt statt zu verdoppeln.
 */
final class DemoImporter
{
    public function __construct(private readonly DemoStore $store, private readonly string $dataDir)
    {
    }

    /** @return array<string,mixed> */
    public function dataset(bool $checkImages = true): array
    {
        $file = rtrim($this->dataDir, '/') . '/products.json';
        if (!is_file($file)) {
            throw new \RuntimeException('Demo-Datensatz fehlt: ' . $file);
        }
        $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data) || empty($data['categories']) || empty($data['products']) || !is_string($data['sku_prefix'] ?? null) || $data['sku_prefix'] === '') {
            throw new \RuntimeException('Demo-Datensatz unvollständig: categories, products und sku_prefix sind Pflicht.');
        }
        $categories = array_column($data['categories'], 'slug');
        foreach ($data['products'] as $p) {
            if (!str_starts_with((string) ($p['sku'] ?? ''), $data['sku_prefix'])) {
                throw new \RuntimeException('SKU ohne Präfix ' . $data['sku_prefix'] . ': ' . ($p['sku'] ?? '?'));
            }
            if (!in_array($p['category'] ?? null, $categories, true)) {
                throw new \RuntimeException('Unbekannte Kategorie bei ' . $p['sku']);
            }
            foreach ($checkImages ? ($p['images'] ?? []) : [] as $img) {
                if (!is_file($this->imagePath((string) $img))) {
                    throw new \RuntimeException('Bild fehlt: ' . $img);
                }
            }
        }

        return $data;
    }

    /** @return array{categories:int,products:int,media:int,variants:int} */
    public function import(): array
    {
        $data = $this->dataset();
        $skus = [];
        $ownIds = [];
        foreach ($data['products'] as $p) {
            $skus[] = $p['sku'];
            $ownIds[] = self::id('product', $p['sku']);
            foreach ($p['variations']['options'] ?? [] as $o) {
                $skus[] = $o['sku'];
                $ownIds[] = self::id('product', $o['sku']);
            }
        }
        $foreign = $this->store->foreignSkus($skus, $ownIds);
        if ($foreign) {
            throw new \RuntimeException('Artikelnummern sind schon von echten Artikeln belegt, nichts importiert: ' . implode(', ', $foreign));
        }

        $this->store->ensureTag();
        foreach ($data['categories'] as $c) {
            $this->store->saveCategory(self::id('category', $c['slug']), $c['name'], (string) ($c['description'] ?? ''));
        }
        $media = 0;
        $variants = 0;
        foreach ($data['products'] as $p) {
            $mediaIds = [];
            foreach ($p['images'] ?? [] as $img) {
                $mid = self::id('media', basename((string) $img));
                if (!$this->store->mediaExists($mid)) {
                    $this->store->saveMedia($mid, $this->imagePath((string) $img), pathinfo((string) $img, PATHINFO_FILENAME));
                }
                $mediaIds[] = $mid;
                ++$media;
            }
            $product = $this->buildProduct($p, $mediaIds);
            $variants += count($product['variants']);
            $this->store->saveProduct($product);
        }

        return ['categories' => count($data['categories']), 'products' => count($data['products']), 'media' => $media, 'variants' => $variants];
    }

    /** @return array{product:int,category:int,media:int} Anzahl der Einträge mit Tag "mt-demo" */
    public function counts(): array
    {
        $out = [];
        $whitelist = $this->whitelist($this->dataset(false));
        foreach (DemoStore::ENTITIES as $e) {
            $out[$e] = count(array_intersect($this->store->taggedIds($e), $whitelist[$e]));
        }

        return $out;
    }

    /**
     * IDs, die der Import aus dem Datensatz ableitet. Nur diese dürfen je gelöscht werden (zusätzlich zum Tag).
     *
     * @param array<string,mixed> $data
     * @return array{product:list<string>,category:list<string>,media:list<string>,variants:array<string,list<string>>}
     */
    private function whitelist(array $data): array
    {
        $products = [];
        $variants = [];
        $media = [];
        foreach ($data['products'] as $p) {
            $pid = self::id('product', (string) $p['sku']);
            $products[] = $pid;
            $variants[$pid] = [];
            foreach ($p['variations']['options'] ?? [] as $o) {
                $variants[$pid][] = self::id('product', (string) $o['sku']);
            }
            foreach ($p['images'] ?? [] as $img) {
                $media[] = self::id('media', basename((string) $img));
            }
        }
        $categories = array_map(static fn ($c) => self::id('category', (string) $c['slug']), $data['categories']);

        return ['product' => $products, 'category' => $categories, 'media' => array_values(array_unique($media)), 'variants' => $variants];
    }

    /**
     * Zeigt die Anzahl, fragt nach ($confirm(frage): bool, entfällt bei $force) und löscht dann.
     *
     * @param callable(string):bool $confirm
     * @param callable(string):void $say
     * @return array{product:int,category:int,media:int}|null gelöschte Anzahl, null bei Abbruch
     */
    public function removeConfirmed(bool $force, callable $confirm, callable $say): ?array
    {
        $n = $this->counts();
        if (array_sum($n) === 0) {
            $say('Keine Demo-Inhalte (Tag mt-demo) vorhanden. Nichts zu tun.');

            return $n;
        }
        $say(sprintf('Gefunden mit Tag mt-demo: %d Artikel, %d Kategorien, %d Bilder. Echte Artikel bleiben unberührt.', $n['product'], $n['category'], $n['media']));
        if (!$force && !$confirm('Diese Demo-Inhalte jetzt löschen?')) {
            return null;
        }

        return $this->remove($say);
    }

    /**
     * Löscht nur Einträge, die den Tag "mt-demo" tragen UND deren ID aus dem Datensatz abgeleitet ist.
     * Kategorien/Bilder/Eigenschaftsgruppen/Lieferzeiten, die von nicht entfernten Einträgen benutzt werden, bleiben stehen.
     *
     * @param (callable(string):void)|null $say meldet übersprungene Einträge
     * @return array{product:int,category:int,media:int} gelöschte Anzahl
     */
    public function remove(?callable $say = null): array
    {
        $say ??= static function (string $m): void {
        };
        $data = $this->dataset(false);
        $white = $this->whitelist($data);

        $tagged = [];
        foreach (DemoStore::ENTITIES as $e) {
            $tagged[$e] = $this->store->taggedIds($e);
            $foreign = array_diff($tagged[$e], $white[$e]);
            if ($foreign) {
                $say(sprintf('Übersprungen (Tag mt-demo, aber nicht aus dem Datensatz): %d %s.', count($foreign), $e));
            }
        }

        $products = array_values(array_intersect($tagged['product'], $white['product']));
        $removableProducts = $products;
        foreach ($products as $pid) {
            array_push($removableProducts, ...$white['variants'][$pid]);
        }
        $categories = array_values(array_intersect($tagged['category'], $white['category']));
        $mediaCandidates = array_values(array_intersect($tagged['media'], $white['media']));

        $categoriesOk = [];
        foreach ($categories as $id) {
            if ($this->store->inUseByOthers('category', $id, $removableProducts, $categories)) {
                $say('Übersprungen (Kategorie wird von anderen Einträgen benutzt): ' . $id);
            } else {
                $categoriesOk[] = $id;
            }
        }
        $mediaOk = [];
        foreach ($mediaCandidates as $id) {
            if ($this->store->inUseByOthers('media', $id, $removableProducts, $categoriesOk)) {
                $say('Übersprungen (Bild wird von anderen Einträgen benutzt): ' . $id);
            } else {
                $mediaOk[] = $id;
            }
        }
        $groups = [];
        foreach ($this->propertyGroupIds($data) as $id) {
            if ($this->store->inUseByOthers('property_group', $id, $removableProducts, $categoriesOk)) {
                $say('Übersprungen (Eigenschaftsgruppe wird von anderen Artikeln benutzt): ' . $id);
            } else {
                $groups[] = $id;
            }
        }
        $times = [];
        foreach ($this->deliveryTimeIds($data) as $id) {
            if ($this->store->inUseByOthers('delivery_time', $id, $removableProducts, $categoriesOk)) {
                $say('Übersprungen (Lieferzeit wird von anderen Artikeln benutzt): ' . $id);
            } else {
                $times[] = $id;
            }
        }

        $this->store->delete('product', $products);
        $this->store->delete('category', $categoriesOk);
        $this->store->delete('media', $mediaOk);
        $this->store->delete('property_group', $groups);
        $this->store->delete('delivery_time', $times);

        return ['product' => count($products), 'category' => count($categoriesOk), 'media' => count($mediaOk)];
    }

    /**
     * @param array<string,mixed> $p Datensatz-Eintrag
     * @param list<string> $mediaIds
     * @return array<string,mixed>
     */
    public function buildProduct(array $p, array $mediaIds): array
    {
        $props = [];
        foreach ($p['attributes'] ?? [] as $a) {
            $props[] = self::property((string) $a['name'], (string) $a['value']);
        }
        $variants = [];
        $variantGroup = null;
        $settings = [];
        if (!empty($p['variations']['options'])) {
            $variantGroup = (string) $p['variations']['attribute'];
            foreach ($p['variations']['options'] as $o) {
                $opt = self::property($variantGroup, (string) $o['value']);
                $settings[] = $opt;
                $variants[] = [
                    'id' => self::id('product', $o['sku']),
                    'sku' => (string) $o['sku'],
                    'stock' => (int) $o['stock'],
                    'gross' => isset($o['price']) ? (float) $o['price'] : null,
                    'option' => $opt,
                ];
            }
        }
        $deliveryTime = null;
        if (preg_match('/^(\d+)\s*-\s*(\d+)\s+Werktage$/u', (string) $p['delivery_time'], $m)) {
            $deliveryTime = ['id' => self::id('delivery', (string) $p['delivery_time']), 'name' => (string) $p['delivery_time'], 'min' => (int) $m[1], 'max' => (int) $m[2]];
        }
        $dim = $p['dimensions'] ?? [];

        return [
            'id' => self::id('product', $p['sku']),
            'sku' => (string) $p['sku'],
            'name' => (string) $p['title'],
            'short' => (string) ($p['short'] ?? ''),
            'description' => (string) ($p['description'] ?? ''),
            'gross' => (float) $p['price'],
            'listGross' => !empty($p['compare_price']) ? (float) $p['compare_price'] : null,
            'stock' => (int) $p['stock'],
            'deliveryTime' => $deliveryTime,
            'weight' => isset($p['weight']) ? (float) $p['weight'] : null,
            'length' => isset($dim['length']) ? (float) $dim['length'] : null,
            'width' => isset($dim['width']) ? (float) $dim['width'] : null,
            'height' => isset($dim['height']) ? (float) $dim['height'] : null,
            'categoryId' => self::id('category', $p['category']),
            'mediaIds' => $mediaIds,
            'properties' => $props,
            'variantGroup' => $variantGroup,
            'variantOptions' => $settings,
            'variants' => $variants,
        ];
    }

    public static function id(string $kind, string $key): string
    {
        return md5('mt-demo:' . $kind . ':' . $key);
    }

    /** @return array{id:string,name:string,groupId:string,group:string} */
    private static function property(string $group, string $value): array
    {
        return ['id' => self::id('option', $group . '=' . $value), 'name' => $value, 'groupId' => self::id('group', $group), 'group' => $group];
    }

    private function imagePath(string $rel): string
    {
        return rtrim($this->dataDir, '/') . '/' . ltrim($rel, '/');
    }

    /**
     * @param array<string,mixed> $data
     * @return list<string>
     */
    private function propertyGroupIds(array $data): array
    {
        $ids = [];
        foreach ($data['products'] as $p) {
            foreach ($p['attributes'] ?? [] as $a) {
                $ids[self::id('group', (string) $a['name'])] = true;
            }
            if (!empty($p['variations']['attribute'])) {
                $ids[self::id('group', (string) $p['variations']['attribute'])] = true;
            }
        }

        return array_keys($ids);
    }

    /**
     * @param array<string,mixed> $data
     * @return list<string>
     */
    private function deliveryTimeIds(array $data): array
    {
        $ids = [];
        foreach ($data['products'] as $p) {
            $ids[self::id('delivery', (string) $p['delivery_time'])] = true;
        }

        return array_keys($ids);
    }
}
