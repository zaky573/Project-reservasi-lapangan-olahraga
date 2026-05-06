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
        $headerRowIndex = count($metadataRows) + 4;
        $metaValueMerge = min(max($columnCount - 2, 0), 4);
        $summaryMerge = min(max($columnCount - 1, 0), 4);
        $summaryValueMerge = min(max($columnCount - 2, 0), 3);

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

        $xml .= '<Row ss:Height="30">'.$this->cell($title, 'String', 'Title', $mergeAcross).'</Row>'."\n";
        $xml .= '<Row ss:Height="8"/>'."\n";

        foreach ($metadataRows as $metadata) {
            $xml .= '<Row ss:Height="22">';
            $xml .= $this->cell((string) ($metadata['label'] ?? ''), 'String', 'MetaLabel');
            $xml .= $this->cell((string) ($metadata['value'] ?? ''), 'String', 'MetaValue', $metaValueMerge);
            $xml .= '</Row>'."\n";
        }

        $xml .= '<Row ss:Height="12"/>'."\n";
        $xml .= '<Row ss:Height="34">';

        foreach ($columns as $column) {
            $xml .= $this->cell((string) $column['heading'], 'String', 'Header');
        }

        $xml .= '</Row>'."\n";

        if ($rows === []) {
            $xml .= '<Row ss:Height="24">'.$this->cell('Tidak ada data pemesanan pada periode ini.', 'String', 'Empty', $mergeAcross).'</Row>'."\n";
        } else {
            foreach ($rows as $rowIndex => $row) {
                $xml .= '<Row ss:Height="24">';

                foreach ($columns as $column) {
                    $key = $column['key'];
                    $type = $column['type'] ?? 'String';
                    $style = $this->resolveDataStyle($column, $row[$key] ?? '', $rowIndex);

                    $xml .= $this->cell($row[$key] ?? '', $type, $style);
                }

                $xml .= '</Row>'."\n";
            }
        }

        $xml .= '<Row ss:Height="12"/>'."\n";
        $xml .= '<Row ss:Height="24">'.$this->cell('Ringkasan', 'String', 'SummaryTitle', $summaryMerge).'</Row>'."\n";

        foreach ($summaryRows as $summary) {
            $xml .= '<Row ss:Height="23">';
            $xml .= $this->cell((string) ($summary['label'] ?? ''), 'String', 'SummaryLabel');
            $xml .= $this->cell(
                $summary['value'] ?? '',
                $summary['type'] ?? 'String',
                ($summary['style'] ?? null) === 'Currency' ? 'SummaryCurrency' : 'SummaryValue',
                $summaryValueMerge
            );
            $xml .= '</Row>'."\n";
        }

        $xml .= '</Table>'."\n";
        $xml .= '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">'."\n";
        $xml .= '<Selected/>'."\n";
        $xml .= '<FreezePanes/>'."\n";
        $xml .= '<FrozenNoSplit/>'."\n";
        $xml .= '<SplitHorizontal>'.$headerRowIndex.'</SplitHorizontal>'."\n";
        $xml .= '<TopRowBottomPane>'.$headerRowIndex.'</TopRowBottomPane>'."\n";
        $xml .= '<ActivePane>2</ActivePane>'."\n";
        $xml .= '<Panes><Pane><Number>2</Number><ActiveRow>'.$headerRowIndex.'</ActiveRow></Pane></Panes>'."\n";
        $xml .= '<ProtectObjects>False</ProtectObjects>'."\n";
        $xml .= '<ProtectScenarios>False</ProtectScenarios>'."\n";
        $xml .= '</WorksheetOptions>'."\n";
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
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
<Interior ss:Color="#281C59" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="MetaLabel">
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#281C59"/>
<Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="MetaValue">
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="11"/>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="Header">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders>
<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#281C59"/>
<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
</Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
<Interior ss:Color="#281C59" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="DataText">
<Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
</Style>
<Style ss:ID="DataTextAlt">
<Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="DataCenter">
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
</Style>
<Style ss:ID="DataCenterAlt">
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="DataNumber">
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
</Style>
<Style ss:ID="DataNumberAlt">
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="DataCurrency">
<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<NumberFormat ss:Format="&quot;Rp&quot; #,##0"/>
</Style>
<Style ss:ID="DataCurrencyAlt">
<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
<NumberFormat ss:Format="&quot;Rp&quot; #,##0"/>
</Style>
<Style ss:ID="StatusSuccess">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7E0C3"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7E0C3"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7E0C3"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B7E0C3"/></Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#166534"/>
<Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="StatusWarning">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/></Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#854D0E"/>
<Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="StatusInfo">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFE7EF"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFE7EF"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFE7EF"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFE7EF"/></Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#155E75"/>
<Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="StatusDanger">
<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/></Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#991B1B"/>
<Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="SummaryTitle">
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
<Interior ss:Color="#4E8D9C" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="SummaryLabel">
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#281C59"/>
<Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="SummaryValue">
<Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
</Style>
<Style ss:ID="SummaryCurrency">
<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9DEE8"/></Borders>
<NumberFormat ss:Format="&quot;Rp&quot; #,##0"/>
<Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
<Style ss:ID="Empty">
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
<Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#64748B"/>
<Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
</Style>
</Styles>
XML."\n";
    }

    private function resolveDataStyle(array $column, mixed $value, int $rowIndex): string
    {
        if (in_array($column['key'] ?? '', ['payment_status', 'status'], true)) {
            return $this->statusStyle((string) $value);
        }

        $isAlt = $rowIndex % 2 === 1;

        if (($column['style'] ?? null) === 'Currency') {
            return $isAlt ? 'DataCurrencyAlt' : 'DataCurrency';
        }

        if (($column['type'] ?? null) === 'Number') {
            return $isAlt ? 'DataNumberAlt' : 'DataNumber';
        }

        if (in_array($column['key'] ?? '', ['id_payment', 'booking_date', 'time_slot', 'payment_method'], true)) {
            return $isAlt ? 'DataCenterAlt' : 'DataCenter';
        }

        return $isAlt ? 'DataTextAlt' : 'DataText';
    }

    private function statusStyle(string $value): string
    {
        $status = strtolower($value);

        if (in_array($status, ['lunas', 'selesai'], true)) {
            return 'StatusSuccess';
        }

        if (in_array($status, ['dibatalkan', 'ditolak'], true)) {
            return 'StatusDanger';
        }

        if (str_contains($status, 'menunggu') || str_contains($status, 'verif') || str_contains($status, 'awal')) {
            return 'StatusWarning';
        }

        return 'StatusInfo';
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
