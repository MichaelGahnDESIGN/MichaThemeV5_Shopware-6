<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

/** Lizenz und Katalog: nur HTTPS, keine Weiterleitungen, Zeitlimit, Größenlimit. */
final class HttpFetcher
{
    /** @return array{status:int,body:string}|null null = Netzwerkfehler oder zu groß */
    public static function get(string $url, int $timeout = 5, int $maxBytes = 524288): ?array
    {
        return self::request($url, null, $timeout, $maxBytes);
    }

    /** Token bleibt im Header, auch bei Fehlern und Weiterleitungen. @param array<string,mixed> $request */
    public static function post(string $url, array $request, int $timeout = 4, int $maxBytes = 65536): ?array
    {
        return self::request($url, $request, $timeout, $maxBytes);
    }

    private static function request(string $url, ?array $request, int $timeout, int $maxBytes): ?array
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
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
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
        if ($request !== null) {
            $headers = [];
            foreach ($request['headers'] as $name => $value) {
                $headers[] = $name . ': ' . $value;
            }
            curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $request['body'], CURLOPT_HTTPHEADER => $headers]);
        }
        $ok = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if ($tooBig || $ok === false) {
            return null;
        }

        return ['status' => $status, 'body' => $body];
    }
}
