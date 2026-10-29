<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/** Verständliche Sätze zum Lizenzstatus (aus LicenseClient::state()). Kein Lizenzcode, nie. */
final class LicenseTexts
{
    public const SHOP_URL = 'https://theme.michael-gahn.de';

    private const TIERS = ['plus' => 'Plus', 'pro' => 'Pro', 'agency' => 'Agentur', 'free' => 'Free'];

    private const REASONS = [
        'no_token' => 'Kein Lizenzcode eingetragen. Das Theme läuft mit allen Free-Funktionen.',
        'unreachable' => 'Der Lizenzserver ist gerade nicht erreichbar. Free-Funktionen bleiben aktiv, Ihr Shop läuft normal weiter.',
        'token_expired' => 'Die Lizenz ist abgelaufen. Free-Funktionen bleiben aktiv.',
        'token_revoked' => 'Die Lizenz wurde widerrufen oder gekündigt. Free-Funktionen bleiben aktiv.',
        'domain_mismatch' => 'Dieser Lizenzcode gilt nicht für diese Domain. Free-Funktionen bleiben aktiv.',
        'signature_invalid' => 'Der Lizenzcode ist nicht gültig. Bitte prüfen Sie, ob er vollständig kopiert wurde.',
        'token_malformed' => 'Der Lizenzcode sieht nicht richtig aus. Bitte vollständig aus dem Kundenkonto kopieren.',
        'unknown_tier' => 'Die Lizenz gehört zu keiner bekannten Stufe. Free-Funktionen bleiben aktiv.',
    ];

    /**
     * @param array<string,mixed> $state LicenseClient::state()
     * @return array{kind:string,title:string,text:string}  kind: free|active|problem
     */
    public static function describe(array $state, ?string $periodEnd = null): array
    {
        if (($state['valid'] ?? false) === true) {
            $tier = self::TIERS[$state['tier'] ?? ''] ?? 'Pro';
            $text = 'Ihre Lizenz ist gültig (Stufe ' . $tier . ').';
            $mods = array_values(array_filter((array) ($state['modules'] ?? []), 'is_string'));
            if ($mods && !in_array($state['tier'] ?? '', ['pro', 'agency'], true)) {
                $text .= ' Gebuchte Module: ' . implode(', ', array_map(static fn (string $m): string => preg_replace('/[^A-Za-z0-9_ -]/', '', $m) ?? '', $mods)) . '.';
            }
            if ($periodEnd !== null && ($t = strtotime($periodEnd)) !== false) {
                $text .= ' Gültig bis ' . gmdate('d.m.Y', $t) . '.';
            }
            if (($state['source'] ?? '') === 'grace') {
                $text .= ' Der Lizenzserver war nicht erreichbar, es gilt der zuletzt geprüfte Stand.';
            }

            return ['kind' => 'active', 'title' => 'Pro aktiv', 'text' => $text];
        }
        $reason = (string) ($state['reason'] ?? 'no_token');
        if ($reason === 'no_token') {
            return ['kind' => 'free', 'title' => 'Free aktiv', 'text' => self::REASONS['no_token']];
        }

        return ['kind' => 'problem', 'title' => 'Lizenz nicht aktiv', 'text' => self::REASONS[$reason] ?? 'Die Lizenz ist ungültig. Free-Funktionen bleiben aktiv.'];
    }

    /** Hinweis zum Datenschutz (steht auf der Lizenzseite). */
    public static function privacy(): string
    {
        return 'Zur Prüfung gehen nur Lizenzcode und Domain an ' . self::SHOP_URL . '. Besucher Ihres Shops sind nicht betroffen.';
    }
}
