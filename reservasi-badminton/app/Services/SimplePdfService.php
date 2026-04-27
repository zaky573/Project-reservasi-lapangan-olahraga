<?php

namespace App\Services;

class SimplePdfService
{
    public function generateFromLines(array $pages, string $title = 'Document'): string
    {
        $objects = [];
        $pageObjectNumbers = [];
        $contentObjectNumbers = [];

        foreach ($pages as $index => $lines) {
            $pageObjectNumbers[$index] = 5 + ($index * 2);
            $contentObjectNumbers[$index] = 6 + ($index * 2);
        }

        $kids = array_map(fn ($pageObjectNumber) => $pageObjectNumber.' 0 R', $pageObjectNumbers);

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($pages).' >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
        $objects[4] = '<< /Title '.$this->pdfString($title).' >>';

        foreach ($pages as $index => $lines) {
            $content = $this->buildPageContent($lines);

            $objects[$pageObjectNumbers[$index]] =
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents '.$contentObjectNumbers[$index].' 0 R >>';

            $objects[$contentObjectNumbers[$index]] =
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
        $pdf .= '<< /Size '.$size.' /Root 1 0 R /Info 4 0 R >>'."\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function buildPageContent(array $lines): string
    {
        $content = "BT\n/F1 6 Tf\n14 580 Td\n8 TL\n";

        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $content .= "T*\n";
            }

            $content .= $this->pdfString($line)." Tj\n";
        }

        return $content."ET";
    }

    private function pdfString(string $value): string
    {
        $sanitized = preg_replace('/[^\x20-\x7E]/', '?', $value) ?? '';
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $sanitized);

        return '('.$escaped.')';
    }
}
