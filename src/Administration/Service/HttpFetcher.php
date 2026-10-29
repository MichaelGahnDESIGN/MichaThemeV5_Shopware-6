<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

/** Kleiner GET-Client für Lizenz und Katalog: nur https, keine Weiterleitungen, Zeitlimit, Größenlimit. */
final class HttpFetcher
{
    /** @return array{status:int,body:string}|null null = Netzwerkfehler oder zu groß */
    public static function get(string $url, int $timeout = 5, int $maxBytes = 524288): ?array
    {
        if (!str_starts_with($url, 'https://') || !function_exists('curl_init')) {
            return null;
        }
        $curl = curl_init($url);
        if ($curl === false) {
            return null;
        }
        $body = '';
        $tooBig = false;
        curl_setopt_array($curl, [
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_CONNECTTIMEOUT => $timeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_USERAGENT => 'MichaThemeV5-Admin',
            CURLOPT_WRITEFUNCTION => static function ($ch, string $chunk) use (&$body, &$tooBig, $maxBytes): int {
                $body .= $chunk;
                if (strlen($body) > $maxBytes) {
                    $tooBig = true;

                    return 0; // abbrechen
                }

                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        if ($tooBig || $ok === false) {
            return null;
        }

        return ['status' => $status, 'body' => $body];
    }
}
