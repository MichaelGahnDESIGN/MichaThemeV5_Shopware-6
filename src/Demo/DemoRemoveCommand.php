<?php

declare(strict_types=1);

namespace MichaThemeV5\Demo;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/** bin/console michatheme:demo:remove löscht ausschließlich Einträge mit dem Tag mt-demo, nach Anzeige der Anzahl und Bestätigung. */
#[AsCommand(name: 'michatheme:demo:remove', description: 'Entfernt die MichaTheme-Demo-Inhalte (nur Einträge mit Tag mt-demo)')]
final class DemoRemoveCommand extends Command
{
    public function __construct(private readonly DemoStore $store, private readonly ?string $dataDir = null)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Ohne Rückfrage löschen (für Skripte)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $importer = new DemoImporter($this->store, $this->dataDir ?? dirname(__DIR__) . '/Resources/demo-data');
        try {
            $done = $importer->removeConfirmed(
                (bool) $input->getOption('force'),
                static fn (string $q): bool => $io->confirm($q, false),
                static function (string $m) use ($io): void {
                    $io->writeln($m);
                }
            );
        } catch (\Throwable $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        }
        if ($done === null) {
            $io->warning('Abgebrochen, nichts gelöscht. (In Skripten --force verwenden.)');

            return Command::FAILURE;
        }
        if (array_sum($done) > 0) {
            $io->success(sprintf('Gelöscht: %d Artikel, %d Kategorien, %d Bilder.', $done['product'], $done['category'], $done['media']));
        }

        return Command::SUCCESS;
    }
}
