<?php

namespace App\Services;

class SimplePdfService
{
    private const PAGE_WIDTH = 842;
    private const PAGE_HEIGHT = 595;
    private const MARGIN_X = 28;
    private const MARGIN_TOP = 28;
    private const MARGIN_BOTTOM = 28;
    private const FONT_SIZE = 6.6;
    private const LINE_HEIGHT = 8.2;

    public function generateReport(
        string $title,
        array $metadataRows,
        array $columns,
        array $rows,
        array $summaryRows
    ): string {
        $pages = [];
        $page = $this->newPage();
        $y = self::PAGE_HEIGHT - self::MARGIN_TOP;

        $this->drawReportHeader($page, $title, $metadataRows, $y);
        $this->drawTableHeader($page, $columns, $y);

        if ($rows === []) {
            $this->drawEmptyRow($page, $columns, $y);
        } else {
            foreach ($rows as $index => $row) {
                $height = $this->rowHeight($columns, $row);

                if ($y - $height < self::MARGIN_BOTTOM + 86) {
                    $pages[] = $page;
                    $page = $this->newPage();
                    $y = self::PAGE_HEIGHT - self::MARGIN_TOP;
                    $this->drawContinuationHeader($page, $title, $metadataRows, $y);
                    $this->drawTableHeader($page, $columns, $y);
                }

                $this->drawDataRow($page, $columns, $row, $index, $y, $height);
            }
        }

        if ($y - $this->summaryHeight($summaryRows) < self::MARGIN_BOTTOM) {
            $pages[] = $page;
            $page = $this->newPage();
            $y = self::PAGE_HEIGHT - self::MARGIN_TOP;
        }

        $this->drawSummary($page, $summaryRows, $y);
        $pages[] = $page;

        return $this->buildPdf($pages, $title);
    }

    public function generateFromLines(array $pages, string $title = 'Document'): string
    {
        $structuredPages = [];

        foreach ($pages as $lines) {
            $page = $this->newPage();
            $y = self::PAGE_HEIGHT - self::MARGIN_TOP;
            $this->setFont($page, 6);

            foreach ($lines as $line) {
                $this->text($page, 14, $y, (string) $line, 6);
                $y -= 8;
            }

            $structuredPages[] = $page;
        }

        return $this->buildPdf($structuredPages, $title);
    }

    private function drawReportHeader(array &$page, string $title, array $metadataRows, float &$y): void
    {
        $x = self::MARGIN_X;
        $width = self::PAGE_WIDTH - (self::MARGIN_X * 2);

        $this->rect($page, $x, $y - 24, $width, 24, '#281C59', '#281C59');
        $this->text($page, $x + 10, $y - 16, $title, 18, '#FFFFFF', true);
        $y -= 34;

        $this->drawMetaTable($page, $metadataRows, $x, $y);
        $y -= (count($metadataRows) * 22) + 12;
    }

    private function drawContinuationHeader(array &$page, string $title, array $metadataRows, float &$y): void
    {
        $continuationTitle = $title.' (lanjutan)';
        $this->drawReportHeader($page, $continuationTitle, $metadataRows, $y);
    }

    private function drawMetaTable(array &$page, array $metadataRows, float $x, float $topY): void
    {
        $labelWidth = 92;
        $valueWidth = 250;
        $rowHeight = 22;
        $y = $topY;

        foreach ($metadataRows as $metadata) {
            $this->rect($page, $x, $y - $rowHeight, $labelWidth, $rowHeight, '#F1F5F9', '#D9DEE8');
            $this->rect($page, $x + $labelWidth, $y - $rowHeight, $valueWidth, $rowHeight, '#FFFFFF', '#D9DEE8');
            $this->text($page, $x + 7, $y - 14, (string) ($metadata['label'] ?? ''), 8.2, '#281C59', true);
            $this->text($page, $x + $labelWidth + 7, $y - 14, (string) ($metadata['value'] ?? ''), 8.2);
            $y -= $rowHeight;
        }
    }

    private function drawTableHeader(array &$page, array $columns, float &$y): void
    {
        $x = self::MARGIN_X;
        $height = 25;

        foreach ($this->resolvedColumns($columns) as $column) {
            $this->rect($page, $x, $y - $height, $column['pdf_width'], $height, '#281C59', '#D9DEE8');
            $lines = $this->wrapText((string) $column['heading'], $column['pdf_width'] - 8, 6.5);
            $textY = $y - 9;

            foreach (array_slice($lines, 0, 2) as $line) {
                $this->text($page, $x + 4, $textY, $line, 6.5, '#FFFFFF', true);
                $textY -= 7.4;
            }

            $x += $column['pdf_width'];
        }

        $y -= $height;
    }

    private function drawDataRow(array &$page, array $columns, array $row, int $rowIndex, float &$y, float $height): void
    {
        $x = self::MARGIN_X;
        $background = $rowIndex % 2 === 1 ? '#F8FAFC' : '#FFFFFF';

        foreach ($this->resolvedColumns($columns) as $column) {
            $key = (string) $column['key'];
            $value = $row[$key] ?? '';
            $style = $this->cellStyle($column, $value, $background);

            $this->rect($page, $x, $y - $height, $column['pdf_width'], $height, $style['fill'], $style['border']);
            $this->drawCellText($page, $column, $value, $x, $y, $height, $style['color'], $style['bold']);
            $x += $column['pdf_width'];
        }

        $y -= $height;
    }

    private function drawCellText(
        array &$page,
        array $column,
        mixed $value,
        float $x,
        float $y,
        float $height,
        string $color,
        bool $bold
    ): void {
        $text = $this->displayValue($value, $column);
        $width = (float) $column['pdf_width'];
        $lines = $this->wrapText($text, $width - 8, self::FONT_SIZE);
        $lines = array_slice($lines, 0, max((int) floor(($height - 6) / self::LINE_HEIGHT), 1));
        $textY = $y - 9;

        foreach ($lines as $line) {
            $lineWidth = $this->textWidth($line, self::FONT_SIZE);
            $align = $this->columnAlign($column);
            $textX = match ($align) {
                'right' => $x + $width - $lineWidth - 4,
                'center' => $x + (($width - $lineWidth) / 2),
                default => $x + 4,
            };

            $this->text($page, $textX, $textY, $line, self::FONT_SIZE, $color, $bold);
            $textY -= self::LINE_HEIGHT;
        }
    }

    private function drawEmptyRow(array &$page, array $columns, float &$y): void
    {
        $width = array_sum(array_column($this->resolvedColumns($columns), 'pdf_width'));
        $height = 28;

        $this->rect($page, self::MARGIN_X, $y - $height, $width, $height, '#F8FAFC', '#D9DEE8');
        $this->text($page, self::MARGIN_X + 12, $y - 17, 'Tidak ada data pemesanan pada periode ini.', 8, '#64748B');
        $y -= $height;
    }

    private function drawSummary(array &$page, array $summaryRows, float &$y): void
    {
        $x = self::MARGIN_X;
        $width = 342;
        $labelWidth = 180;
        $rowHeight = 20;

        $y -= 12;
        $this->rect($page, $x, $y - 23, $width, 23, '#4E8D9C', '#4E8D9C');
        $this->text($page, $x + 8, $y - 15, 'Ringkasan', 11, '#FFFFFF', true);
        $y -= 23;

        foreach ($summaryRows as $summary) {
            $this->rect($page, $x, $y - $rowHeight, $labelWidth, $rowHeight, '#F1F5F9', '#D9DEE8');
            $this->rect($page, $x + $labelWidth, $y - $rowHeight, $width - $labelWidth, $rowHeight, '#FFFFFF', '#D9DEE8');
            $this->text($page, $x + 7, $y - 13, (string) ($summary['label'] ?? ''), 7.5, '#281C59', true);

            $value = $this->displayValue($summary['value'] ?? '', $summary);
            $valueWidth = $this->textWidth($value, 7.5);
            $valueX = ($summary['style'] ?? null) === 'Currency'
                ? $x + $width - $valueWidth - 7
                : $x + $labelWidth + 7;

            $this->text($page, $valueX, $y - 13, $value, 7.5, '#170B4F', ($summary['style'] ?? null) === 'Currency');
            $y -= $rowHeight;
        }
    }

    private function rowHeight(array $columns, array $row): float
    {
        $maxLines = 1;

        foreach ($this->resolvedColumns($columns) as $column) {
            $value = $this->displayValue($row[$column['key']] ?? '', $column);
            $maxLines = max($maxLines, count($this->wrapText($value, $column['pdf_width'] - 8, self::FONT_SIZE)));
        }

        return max(22, min(42, 8 + ($maxLines * self::LINE_HEIGHT)));
    }

    private function summaryHeight(array $summaryRows): float
    {
        return 12 + 23 + (count($summaryRows) * 20);
    }

    private function resolvedColumns(array $columns): array
    {
        $availableWidth = self::PAGE_WIDTH - (self::MARGIN_X * 2);
        $totalWidth = array_sum(array_map(fn (array $column) => (float) ($column['width'] ?? 100), $columns));
        $totalWidth = $totalWidth > 0 ? $totalWidth : 1;

        return array_map(function (array $column) use ($availableWidth, $totalWidth) {
            $column['pdf_width'] = round((((float) ($column['width'] ?? 100)) / $totalWidth) * $availableWidth, 2);

            return $column;
        }, $columns);
    }

    private function cellStyle(array $column, mixed $value, string $defaultFill): array
    {
        if (in_array($column['key'] ?? '', ['payment_status', 'status'], true)) {
            return match ($this->statusKind((string) $value)) {
                'success' => ['fill' => '#DCFCE7', 'border' => '#B7E0C3', 'color' => '#166534', 'bold' => true],
                'danger' => ['fill' => '#FEE2E2', 'border' => '#FECACA', 'color' => '#991B1B', 'bold' => true],
                'warning' => ['fill' => '#FEF9C3', 'border' => '#FDE68A', 'color' => '#854D0E', 'bold' => true],
                default => ['fill' => '#E0F2FE', 'border' => '#BFE7EF', 'color' => '#155E75', 'bold' => true],
            };
        }

        return ['fill' => $defaultFill, 'border' => '#D9DEE8', 'color' => '#170B4F', 'bold' => false];
    }

    private function statusKind(string $value): string
    {
        $status = strtolower($value);

        if (in_array($status, ['lunas', 'selesai'], true)) {
            return 'success';
        }

        if (in_array($status, ['dibatalkan', 'ditolak'], true)) {
            return 'danger';
        }

        if (str_contains($status, 'menunggu') || str_contains($status, 'verif') || str_contains($status, 'awal')) {
            return 'warning';
        }

        return 'info';
    }

    private function columnAlign(array $column): string
    {
        if (($column['style'] ?? null) === 'Currency') {
            return 'right';
        }

        if (in_array($column['key'] ?? '', ['no', 'id_payment', 'booking_date', 'time_slot', 'payment_method', 'payment_status', 'status'], true)) {
            return 'center';
        }

        return 'left';
    }

    private function displayValue(mixed $value, array $column): string
    {
        if (($column['style'] ?? null) === 'Currency') {
            return 'Rp '.number_format((float) $value, 0, ',', '.');
        }

        if (($column['type'] ?? null) === 'Number' && is_numeric($value)) {
            return number_format((float) $value, 0, ',', '.');
        }

        return (string) $value;
    }

    private function wrapText(string $text, float $maxWidth, float $fontSize): array
    {
        $words = preg_split('/\s+/', trim($text)) ?: [];
        $lines = [];
        $line = '';

        foreach ($words as $word) {
            $candidate = $line === '' ? $word : $line.' '.$word;

            if ($this->textWidth($candidate, $fontSize) <= $maxWidth) {
                $line = $candidate;
                continue;
            }

            if ($line !== '') {
                $lines[] = $line;
            }

            $line = $word;

            while ($this->textWidth($line, $fontSize) > $maxWidth && strlen($line) > 1) {
                $chunk = $line;

                while ($this->textWidth($chunk, $fontSize) > $maxWidth && strlen($chunk) > 1) {
                    $chunk = substr($chunk, 0, -1);
                }

                $lines[] = $chunk;
                $line = substr($line, strlen($chunk));
            }
        }

        if ($line !== '') {
            $lines[] = $line;
        }

        return $lines === [] ? [''] : $lines;
    }

    private function textWidth(string $text, float $fontSize): float
    {
        return strlen($this->sanitize($text)) * $fontSize * 0.47;
    }

    private function newPage(): array
    {
        return [
            'commands' => [],
            'font' => null,
        ];
    }

    private function rect(array &$page, float $x, float $y, float $width, float $height, string $fill, string $stroke): void
    {
        $page['commands'][] = $this->rgb($fill, 'rg');
        $page['commands'][] = $this->rgb($stroke, 'RG');
        $page['commands'][] = sprintf('%.2F %.2F %.2F %.2F re B', $x, $y, $width, $height);
    }

    private function text(
        array &$page,
        float $x,
        float $y,
        string $value,
        float $size = 8,
        string $color = '#170B4F',
        bool $bold = false
    ): void {
        $font = $bold ? 'F2' : 'F1';
        $this->setFont($page, $size, $font);
        $page['commands'][] = $this->rgb($color, 'rg');
        $page['commands'][] = sprintf('BT %.2F %.2F Td %s Tj ET', $x, $y, $this->pdfString($value));
    }

    private function setFont(array &$page, float $size, string $font = 'F1'): void
    {
        $fontCommand = sprintf('/%s %.2F Tf', $font, $size);

        if ($page['font'] === $fontCommand) {
            return;
        }

        $page['commands'][] = $fontCommand;
        $page['font'] = $fontCommand;
    }

    private function buildPdf(array $pages, string $title): string
    {
        $objects = [];
        $pageObjectNumbers = [];
        $contentObjectNumbers = [];

        foreach ($pages as $index => $page) {
            $pageObjectNumbers[$index] = 6 + ($index * 2);
            $contentObjectNumbers[$index] = 7 + ($index * 2);
        }

        $kids = array_map(fn ($pageObjectNumber) => $pageObjectNumber.' 0 R', $pageObjectNumbers);

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($pages).' >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
        $objects[5] = '<< /Title '.$this->pdfString($title).' >>';

        foreach ($pages as $index => $page) {
            $content = implode("\n", $page['commands']);
            $contentNumber = $contentObjectNumbers[$index];

            $objects[$pageObjectNumbers[$index]] =
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.self::PAGE_WIDTH.' '.self::PAGE_HEIGHT.'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '.$contentNumber.' 0 R >>';

            $objects[$contentNumber] =
                "<< /Length ".strlen($content)." >>\nstream\n".$content."\nendstream";
        }

        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $number => $object) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $size = max(array_keys($objects)) + 1;

        $pdf .= "xref\n0 ".$size."\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i < $size; $i++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$i] ?? 0)."\n";
        }

        $pdf .= "trailer\n";
        $pdf .= '<< /Size '.$size.' /Root 1 0 R /Info 5 0 R >>'."\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function rgb(string $hex, string $operator): string
    {
        $hex = ltrim($hex, '#');
        $red = hexdec(substr($hex, 0, 2)) / 255;
        $green = hexdec(substr($hex, 2, 2)) / 255;
        $blue = hexdec(substr($hex, 4, 2)) / 255;

        return sprintf('%.3F %.3F %.3F %s', $red, $green, $blue, $operator);
    }

    private function pdfString(string $value): string
    {
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $this->sanitize($value));

        return '('.$escaped.')';
    }

    private function sanitize(string $value): string
    {
        return preg_replace('/[^\x20-\x7E]/', '?', $value) ?? '';
    }
}
