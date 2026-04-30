<?php

namespace App\Services;

class SimpleExcelService
{
    public function generateReport(
        string $title,
        array $metadataRows,
        array $columns,
        array $rows,
        array $summaryRows
    ): string {
        $columnCount = max(count($columns), 1);
        $mergeAcross = $columnCount - 1;

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>'."\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        $xml .= 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        $xml .= 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        $xml .= 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        $xml .= 'xmlns:html="http://www.w3.org/TR/REC-html40">'."\n";
        $xml .= $this->styles();
        $xml .= '<Worksheet ss:Name="'.$this->escapeAttribute($title).'">'."\n";
        $xml .= '<Table>'."\n";

        foreach ($columns as $column) {
            $xml .= '<Column ss:AutoFitWidth="0" ss:Width="'.($column['width'] ?? 100).'"/>'."\n";
        }

        $xml .= '<Row>'.$this->cell($title, 'String', 'Title', $mergeAcross).'</Row>'."\n";

        foreach ($metadataRows as $metadata) {
            $xml .= '<Row>';
            $xml .= $this->cell((string) ($metadata['label'] ?? ''), 'String', 'Label');
            $xml .= $this->cell((string) ($metadata['value'] ?? ''), 'String', null, max($columnCount - 2, 0));
            $xml .= '</Row>'."\n";
        }

        $xml .= '<Row/>'."\n";
        $xml .= '<Row>';

        foreach ($columns as $column) {
            $xml .= $this->cell((string) $column['heading'], 'String', 'Header');
        }

        $xml .= '</Row>'."\n";

        if ($rows === []) {
            $xml .= '<Row>'.$this->cell('Tidak ada data pemesanan pada periode ini.', 'String', 'Text', $mergeAcross).'</Row>'."\n";
        } else {
            foreach ($rows as $row) {
                $xml .= '<Row>';

                foreach ($columns as $column) {
                    $key = $column['key'];
                    $type = $column['type'] ?? 'String';
                    $style = $column['style'] ?? null;

                    $xml .= $this->cell($row[$key] ?? '', $type, $style);
                }

                $xml .= '</Row>'."\n";
            }
        }

        $xml .= '<Row/>'."\n";
        $xml .= '<Row>'.$this->cell('Ringkasan', 'String', 'Section', $mergeAcross).'</Row>'."\n";

        foreach ($summaryRows as $summary) {
            $xml .= '<Row>';
            $xml .= $this->cell((string) ($summary['label'] ?? ''), 'String', 'Label');
            $xml .= $this->cell(
                $summary['value'] ?? '',
                $summary['type'] ?? 'String',
                $summary['style'] ?? null,
                max($columnCount - 2, 0)
            );
            $xml .= '</Row>'."\n";
        }

        $xml .= '</Table>'."\n";
        $xml .= '</Worksheet>'."\n";
        $xml .= '</Workbook>';

        return $xml;
    }

    private function styles(): string
    {
        return <<<'XML'
<Styles>
<Style ss:ID="Default" ss:Name="Normal">
<Alignment ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="11"/>
</Style>
<Style ss:ID="Title">
<Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1"/>
</Style>
<Style ss:ID="Section">
<Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1"/>
</Style>
<Style ss:ID="Label">
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
</Style>
<Style ss:ID="Header">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders>
<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
</Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
<Interior ss:Color="#EAF3F5" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="Currency">
<NumberFormat ss:Format="&quot;Rp&quot; #,##0"/>
</Style>
<Style ss:ID="Text">
<Alignment ss:WrapText="1"/>
</Style>
</Styles>
XML."\n";
    }

    private function cell(mixed $value, string $type = 'String', ?string $styleId = null, int $mergeAcross = 0): string
    {
        $attributes = [];

        if ($styleId) {
            $attributes[] = 'ss:StyleID="'.$styleId.'"';
        }

        if ($mergeAcross > 0) {
            $attributes[] = 'ss:MergeAcross="'.$mergeAcross.'"';
        }

        $cellAttributes = $attributes === [] ? '' : ' '.implode(' ', $attributes);
        $dataType = $type === 'Number' ? 'Number' : 'String';
        $dataValue = $dataType === 'Number'
            ? (string) ((float) $value)
            : $this->escape((string) $value);

        return '<Cell'.$cellAttributes.'><Data ss:Type="'.$dataType.'">'.$dataValue.'</Data></Cell>';
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }

    private function escapeAttribute(string $value): string
    {
        return htmlspecialchars(substr($value, 0, 31), ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }
}
