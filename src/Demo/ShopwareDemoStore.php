<?php

declare(strict_types=1);

namespace MichaThemeV5\Demo;

use Shopware\Core\Content\Media\File\FileSaver;
use Shopware\Core\Content\Media\File\MediaFile;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\NotFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\MultiFilter;
use Shopware\Core\System\SystemConfig\SystemConfigService;

/** DemoStore auf Basis der Shopware-DAL. Texte werden in der Standardsprache des Shops gespeichert. Kein Netzwerkzugriff. */
final class ShopwareDemoStore implements DemoStore
{
    private const STOREFRONT_TYPE = '8a243080f92e4c719546314b577cf82b';

    private ?string $tagId = null;
    private ?float $taxRate = null;

    public function __construct(
        private readonly EntityRepository $productRepository,
        private readonly EntityRepository $categoryRepository,
        private readonly EntityRepository $mediaRepository,
        private readonly EntityRepository $tagRepository,
        private readonly EntityRepository $salesChannelRepository,
        private readonly EntityRepository $taxRepository,
        private readonly EntityRepository $propertyGroupRepository,
        private readonly EntityRepository $deliveryTimeRepository,
        private readonly EntityRepository $mediaDefaultFolderRepository,
        private readonly FileSaver $fileSaver,
        private readonly SystemConfigService $systemConfig,
    ) {
    }

    public function ensureTag(): string
    {
        if ($this->tagId !== null) {
            return $this->tagId;
        }
        $ctx = Context::createDefaultContext();
        $existing = $this->tagRepository->searchIds((new Criteria())->addFilter(new EqualsFilter('name', self::TAG)), $ctx)->firstId();
        if ($existing === null) {
            $existing = DemoImporter::id('tag', self::TAG);
            $this->tagRepository->upsert([['id' => $existing, 'name' => self::TAG]], $ctx);
        }

        return $this->tagId = (string) $existing;
    }

    public function saveCategory(string $id, string $name, string $description): void
    {
        $ctx = Context::createDefaultContext();
        $channel = $this->storefrontChannels($ctx)[0] ?? null;
        $this->categoryRepository->upsert([[
            'id' => $id,
            'parentId' => $channel?->getNavigationCategoryId(),
            'name' => $name,
            'description' => $description,
            'active' => true,
            'visible' => true,
            'type' => 'page',
            'displayNestedProducts' => true,
            'cmsPageId' => $this->systemConfig->get('core.cms.default_category_cms_page'),
            'tags' => [['id' => $this->ensureTag()]],
        ]], $ctx);
    }

    public function mediaExists(string $id): bool
    {
        return $this->mediaRepository->searchIds(new Criteria([$id]), Context::createDefaultContext())->getTotal() > 0;
    }

    public function saveMedia(string $id, string $absPath, string $fileName): void
    {
        $ctx = Context::createDefaultContext();
        $folder = $this->mediaDefaultFolderRepository->search((new Criteria())->addFilter(new EqualsFilter('entity', 'product'))->addAssociation('folder'), $ctx)->first();
        $this->mediaRepository->upsert([[
            'id' => $id,
            'private' => false,
            'mediaFolderId' => $folder?->getFolder()?->getId(),
            'tags' => [['id' => $this->ensureTag()]],
        ]], $ctx);
        $this->fileSaver->persistFileToMedia(new MediaFile($absPath, 'image/jpeg', 'jpg', (int) filesize($absPath)), $fileName, $id, $ctx);
    }

    public function saveProduct(array $p): void
    {
        $ctx = Context::createDefaultContext();
        $channels = $this->storefrontChannels($ctx);
        $price = fn (float $gross, ?float $list = null): array => array_filter([
            'currencyId' => Defaults::CURRENCY,
            'gross' => $gross,
            'net' => round($gross / (1 + $this->taxRate($ctx) / 100), 2),
            'linked' => true,
            'listPrice' => $list === null ? null : ['currencyId' => Defaults::CURRENCY, 'gross' => $list, 'net' => round($list / (1 + $this->taxRate($ctx) / 100), 2), 'linked' => true],
        ], static fn ($v) => $v !== null);

        $media = [];
        foreach ($p['mediaIds'] as $i => $mediaId) {
            $media[] = ['id' => DemoImporter::id('productmedia', $p['id'] . $mediaId), 'mediaId' => $mediaId, 'position' => $i + 1];
        }
        $option = static fn (array $o): array => ['id' => $o['id'], 'name' => $o['name'], 'group' => ['id' => $o['groupId'], 'name' => $o['group']]];

        $row = [
            'id' => $p['id'],
            'productNumber' => $p['sku'],
            'name' => $p['name'],
            'description' => $p['description'],
            'metaDescription' => $p['short'],
            'active' => true,
            'stock' => $p['stock'],
            'isCloseout' => $p['stock'] === 0,
            'taxId' => $this->taxId($ctx),
            'price' => [$price($p['gross'], $p['listGross'])],
            'weight' => $p['weight'],
            'length' => $p['length'],
            'width' => $p['width'],
            'height' => $p['height'],
            'categories' => [['id' => $p['categoryId']]],
            'tags' => [['id' => $this->ensureTag()]],
            'visibilities' => array_map(fn ($c) => ['id' => DemoImporter::id('visibility', $p['id'] . $c->getId()), 'salesChannelId' => $c->getId(), 'visibility' => 30], $channels),
            'media' => $media,
            'coverId' => $media[0]['id'] ?? null,
            'properties' => array_map($option, $p['properties']),
        ];
        if ($p['deliveryTime'] !== null) {
            $row['deliveryTime'] = ['id' => $p['deliveryTime']['id'], 'name' => $p['deliveryTime']['name'], 'min' => $p['deliveryTime']['min'], 'max' => $p['deliveryTime']['max'], 'unit' => 'day'];
        }
        $rows = [array_filter($row, static fn ($v) => $v !== null)];

        if ($p['variants']) {
            $rows[0]['configuratorSettings'] = array_map(
                fn ($o) => ['id' => DemoImporter::id('configurator', $p['id'] . $o['id']), 'option' => $option($o)],
                $p['variantOptions']
            );
            foreach ($p['variants'] as $v) {
                $variant = [
                    'id' => $v['id'],
                    'parentId' => $p['id'],
                    'productNumber' => $v['sku'],
                    'stock' => $v['stock'],
                    'options' => [['id' => $v['option']['id']]],
                    'tags' => [['id' => $this->ensureTag()]],
                ];
                if ($v['gross'] !== null) {
                    $variant['price'] = [$price($v['gross'])];
                }
                $rows[] = $variant;
            }
        }
        $this->productRepository->upsert($rows, $ctx);
    }

    public function foreignSkus(array $skus, array $ownIds): array
    {
        $criteria = (new Criteria())->addFilter(new EqualsAnyFilter('productNumber', $skus));
        if ($ownIds) {
            $criteria->addFilter(new NotFilter(MultiFilter::CONNECTION_AND, [new EqualsAnyFilter('id', $ownIds)]));
        }
        $found = [];
        foreach ($this->productRepository->search($criteria, Context::createDefaultContext())->getEntities() as $product) {
            $found[] = (string) $product->getProductNumber();
        }

        return $found;
    }

    public function taggedIds(string $entity): array
    {
        $criteria = (new Criteria())->addFilter(new EqualsFilter('tags.name', self::TAG));
        if ($entity === 'product') {
            $criteria->addFilter(new EqualsFilter('parentId', null));
        }

        return array_values(array_map('strval', $this->repository($entity)->searchIds($criteria, Context::createDefaultContext())->getIds()));
    }

    public function inUseByOthers(string $entity, string $id, array $removableProductIds, array $removableCategoryIds): bool
    {
        $ctx = Context::createDefaultContext();
        $foreignProducts = static function (Criteria $c) use ($removableProductIds): Criteria {
            if ($removableProductIds) {
                $c->addFilter(new NotFilter(MultiFilter::CONNECTION_AND, [new EqualsAnyFilter('id', $removableProductIds)]));
            }

            return $c->setLimit(1);
        };
        $found = static fn (EntityRepository $r, Criteria $c): bool => $r->searchIds($c, $ctx)->getIds() !== [];

        switch ($entity) {
            case 'category':
                $children = (new Criteria())->addFilter(new EqualsFilter('parentId', $id));
                if ($removableCategoryIds) {
                    $children->addFilter(new NotFilter(MultiFilter::CONNECTION_AND, [new EqualsAnyFilter('id', $removableCategoryIds)]));
                }

                return $found($this->categoryRepository, $children->setLimit(1))
                    || $found($this->productRepository, $foreignProducts((new Criteria())->addFilter(new EqualsFilter('categories.id', $id))));
            case 'media':
                $cat = (new Criteria())->addFilter(new EqualsFilter('mediaId', $id));
                if ($removableCategoryIds) {
                    $cat->addFilter(new NotFilter(MultiFilter::CONNECTION_AND, [new EqualsAnyFilter('id', $removableCategoryIds)]));
                }

                return $found($this->productRepository, $foreignProducts((new Criteria())->addFilter(new EqualsFilter('media.mediaId', $id))))
                    || $found($this->categoryRepository, $cat->setLimit(1));
            case 'property_group':
                return $found($this->productRepository, $foreignProducts((new Criteria())->addFilter(new MultiFilter(MultiFilter::CONNECTION_OR, [
                    new EqualsFilter('properties.groupId', $id),
                    new EqualsFilter('options.groupId', $id),
                    new EqualsFilter('configuratorSettings.option.groupId', $id),
                ]))));
            case 'delivery_time':
                return $found($this->productRepository, $foreignProducts((new Criteria())->addFilter(new EqualsFilter('deliveryTimeId', $id))));
        }

        throw new \InvalidArgumentException('Unbekannte Entität: ' . $entity);
    }

    public function delete(string $entity, array $ids): void
    {
        if (!$ids) {
            return;
        }
        $ctx = Context::createDefaultContext();
        $repo = $this->repository($entity);
        // Nur vorhandene IDs; für property_group/delivery_time sind das ausschließlich die festen Import-IDs
        $existing = array_values($repo->searchIds(new Criteria($ids), $ctx)->getIds());
        if ($existing) {
            $repo->delete(array_map(static fn ($id) => ['id' => $id], $existing), $ctx);
        }
    }

    private function repository(string $entity): EntityRepository
    {
        return match ($entity) {
            'product' => $this->productRepository,
            'category' => $this->categoryRepository,
            'media' => $this->mediaRepository,
            'property_group' => $this->propertyGroupRepository,
            'delivery_time' => $this->deliveryTimeRepository,
            default => throw new \InvalidArgumentException('Unbekannte Entität: ' . $entity),
        };
    }

    /** @return list<\Shopware\Core\System\SalesChannel\SalesChannelEntity> */
    private function storefrontChannels(Context $ctx): array
    {
        $list = array_values($this->salesChannelRepository->search((new Criteria())->addFilter(new EqualsFilter('typeId', self::STOREFRONT_TYPE)), $ctx)->getElements());

        return $list;
    }

    private function taxId(Context $ctx): string
    {
        $tax = $this->taxRepository->search((new Criteria())->addFilter(new EqualsFilter('taxRate', 19.0)), $ctx)->first()
            ?? $this->taxRepository->search(new Criteria(), $ctx)->first();
        if ($tax === null) {
            throw new \RuntimeException('Kein Steuersatz im Shop angelegt.');
        }
        $this->taxRate = (float) $tax->getTaxRate();

        return $tax->getId();
    }

    private function taxRate(Context $ctx): float
    {
        if ($this->taxRate === null) {
            $this->taxId($ctx);
        }

        return (float) $this->taxRate;
    }
}
