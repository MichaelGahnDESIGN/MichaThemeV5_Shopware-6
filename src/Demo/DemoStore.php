<?php

declare(strict_types=1);

namespace MichaThemeV5\Demo;

/**
 * Speicher-Schnittstelle für die Demo-Inhalte. Die Shopware-Umsetzung (ShopwareDemoStore) nutzt die DAL;
 * die Tests nutzen einen Speicher im Arbeitsspeicher. Alles, was gespeichert wird, trägt den Tag "mt-demo".
 */
interface DemoStore
{
    public const TAG = 'mt-demo';
    public const ENTITIES = ['product', 'category', 'media'];

    /** Legt den Tag "mt-demo" an (falls nötig) und gibt seine ID zurück. */
    public function ensureTag(): string;

    public function saveCategory(string $id, string $name, string $description): void;

    public function mediaExists(string $id): bool;

    /** Legt ein Medium mit Tag an und lädt die Datei ($absPath) hoch. */
    public function saveMedia(string $id, string $absPath, string $fileName): void;

    /**
     * Legt ein Produkt (mit Tag) an oder aktualisiert es.
     *
     * @param array<string,mixed> $product Schlüssel siehe DemoImporter::buildProduct()
     */
    public function saveProduct(array $product): void;

    /**
     * Produktnummern aus $skus, die einem Produkt gehören, dessen ID nicht in $ownIds steht (echte Artikel).
     *
     * @param list<string> $skus
     * @param list<string> $ownIds
     * @return list<string>
     */
    public function foreignSkus(array $skus, array $ownIds): array;

    /**
     * IDs der Einträge mit Tag "mt-demo" (Produkte: nur Hauptartikel, Varianten hängen daran).
     *
     * @param 'product'|'category'|'media' $entity
     * @return list<string>
     */
    public function taggedIds(string $entity): array;

    /**
     * Wird der Eintrag von etwas benutzt, das NICHT mit entfernt wird? (category: Kinder/Produkte, media: Produkte/Kategorien,
     * property_group/delivery_time: Produkte). Die mit entfernten Eintraege stehen in $removableProductIds/$removableCategoryIds.
     *
     * @param 'category'|'media'|'property_group'|'delivery_time' $entity
     * @param list<string> $removableProductIds
     * @param list<string> $removableCategoryIds
     */
    public function inUseByOthers(string $entity, string $id, array $removableProductIds, array $removableCategoryIds): bool;

    /**
     * Löscht genau diese IDs. Zusätzlich erlaubt: 'property_group', 'delivery_time' (feste Import-IDs).
     *
     * @param list<string> $ids
     */
    public function delete(string $entity, array $ids): void;
}
