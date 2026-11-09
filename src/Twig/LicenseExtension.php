<?php

declare(strict_types=1);

namespace MichaThemeV5\Twig;

use MichaThemeV5\Client\LicenseClient;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/** Twig-Funktion mt_license_allows(modul, schlüssel): true, wenn ein Modul (z. B. eines separat ausgelieferten Add-ons) per Lizenz freigeschaltet ist. Bei jedem Fehler false. Das Theme selbst nutzt sie nicht. */
class LicenseExtension extends AbstractExtension
{
    private ?LicenseClient $client = null;

    public function __construct(private readonly RequestStack $requests, private readonly CacheItemPoolInterface $cache)
    {
    }

    public function getFunctions(): array
    {
        return [new TwigFunction('mt_license_allows', [$this, 'allows'])];
    }

    public function allows(string $module, ?string $token): bool
    {
        try {
            return $this->client()->allows((string) $token, $module);
        } catch (\Throwable) {
            return false; // Der Shop bricht nie: bei jedem Fehler gilt Free.
        }
    }

    private function client(): LicenseClient
    {
        if ($this->client !== null) {
            return $this->client;
        }
        $domain = (string) ($this->requests->getCurrentRequest()?->getHost() ?? '');

        return $this->client = new LicenseClient(
            getenv('MT_LICENSE_API') ?: 'https://theme.michael-gahn.de/api',
            $domain,
            static function (string $url, array $request): ?array {
                $headers = [];
                foreach ($request['headers'] as $name => $value) {
                    $headers[] = $name . ': ' . $value;
                }
                $ctx = stream_context_create([
                    'http' => ['method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $request['body'], 'timeout' => 4, 'ignore_errors' => true, 'follow_location' => 0, 'max_redirects' => 0],
                    'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
                ]);
                $body = @file_get_contents($url, false, $ctx, 0, 262145);
                if ($body === false || strlen($body) > 262144) {
                    return null;
                }
                $status = 0;
                foreach ($http_response_header ?? [] as $h) {
                    if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) {
                        $status = (int) $m[1];
                    }
                }
                $json = json_decode($body, true);

                return ['status' => $status, 'json' => is_array($json) ? $json : []];
            },
            function (string $k): ?array {
                $item = $this->cache->getItem($k);

                return $item->isHit() && is_array($item->get()) ? $item->get() : null;
            },
            function (string $k, array $v, int $ttl): void {
                $this->cache->save($this->cache->getItem($k)->set($v)->expiresAfter($ttl));
            }
        );
    }
}
