<?php

declare(strict_types=1);

namespace MichaThemeV5\Demo;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/** bin/console michatheme:demo:import legt die Demo-Artikel an (wiederholbar, ohne Dubletten, ohne Netzwerkzugriff). */
#[AsCommand(name: 'michatheme:demo:import', description: 'Legt die MichaTheme-Demo-Artikel (Kategorien, Produkte, Bilder, Tag mt-demo) an')]
final class DemoImportCommand extends Command
{
    public function __construct(private readonly DemoStore $store, private readonly ?string $dataDir = null)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        try {
            $r = (new DemoImporter($this->store, $this->dataDir ?? dirname(__DIR__) . '/Resources/demo-data'))->import();
        } catch (\Throwable $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        }
        $io->success(sprintf('Demo-Inhalte angelegt oder aktualisiert: %d Kategorien, %d Artikel (%d Varianten), %d Bilder. Entfernen mit michatheme:demo:remove.', $r['categories'], $r['products'], $r['variants'], $r['media']));

        return Command::SUCCESS;
    }
}
