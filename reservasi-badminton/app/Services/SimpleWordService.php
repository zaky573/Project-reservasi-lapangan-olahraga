<?php

namespace App\Services;

class SimpleWordService
{
    public function generateReport(
        string $title,
        array $metadataRows,
        array $columns,
        array $rows,
        array $summaryRows
    ): string {
        $columnCount = max(count($columns), 1);

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
        $html .= '<title>'.$this->escape($title).'</title>';
        $html .= $this->styles();
        $html .= '</head><body><div class="WordSection1">';
        $html .= '<h1>'.$this->escape($title).'</h1>';
        $html .= '<table class="meta">';

        foreach ($metadataRows as $metadata) {
            $html .= '<tr>';
            $html .= '<th>'.$this->escape((string) ($metadata['label'] ?? '')).'</th>';
            $html .= '<td>'.$this->escape((string) ($metadata['value'] ?? '')).'</td>';
            $html .= '</tr>';
        }

        $html .= '</table>';
        $html .= '<table class="report">';
        $html .= $this->columnGroup($columns);
        $html .= '<thead><tr>';

        foreach ($columns as $column) {
            $html .= '<th>'.$this->escape((string) $column['heading']).'</th>';
        }

        $html .= '</tr></thead><tbody>';

        if ($rows === []) {
            $html .= '<tr><td class="empty" colspan="'.$columnCount.'">Tidak ada data pemesanan pada periode ini.</td></tr>';
        } else {
            foreach ($rows as $index => $row) {
                $html .= '<tr'.($index % 2 === 1 ? ' class="alt"' : '').'>';

                foreach ($columns as $column) {
                    $key = (string) $column['key'];
                    $value = $row[$key] ?? '';
                    $class = $this->cellClass($column, $value);

                    $html .= '<td class="'.$class.'">'.$this->escape($this->displayValue($value, $column)).'</td>';
                }

                $html .= '</tr>';
            }
        }

        $html .= '</tbody></table>';
        $html .= '<h2>Ringkasan</h2>';
        $html .= '<table class="summary">';

        foreach ($summaryRows as $summary) {
            $html .= '<tr>';
            $html .= '<th>'.$this->escape((string) ($summary['label'] ?? '')).'</th>';
            $html .= '<td class="'.(($summary['style'] ?? null) === 'Currency' ? 'number' : '').'">';
            $html .= $this->escape($this->displayValue($summary['value'] ?? '', $summary));
            $html .= '</td>';
            $html .= '</tr>';
        }

        $html .= '</table>';
        $html .= '</div></body></html>';

        return "\xEF\xBB\xBF".$html;
    }

    private function styles(): string
    {
        return <<<'HTML'
<style>
@page WordSection1 { size: 13in 8.5in; margin: 0.45in 0.35in; }
div.WordSection1 { page: WordSection1; }
body {
  color: #170b4f;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8.5pt;
}
h1 {
  background: #281c59;
  color: #ffffff;
  font-size: 18pt;
  margin: 0 0 10px;
  padding: 10px 12px;
}
h2 {
  background: #4e8d9c;
  color: #ffffff;
  font-size: 12pt;
  margin: 14px 0 0;
  padding: 7px 10px;
}
table {
  border-collapse: collapse;
  width: 100%;
}
.meta {
  margin-bottom: 12px;
  width: 45%;
}
.meta th,
.meta td,
.summary th,
.summary td {
  border: 1px solid #d9dee8;
  padding: 6px 8px;
}
.meta th,
.summary th {
  background: #f1f5f9;
  color: #281c59;
  text-align: left;
  width: 38%;
}
.report {
  table-layout: fixed;
}
.report th,
.report td {
  border: 1px solid #d9dee8;
  line-height: 1.25;
  padding: 5px 6px;
  vertical-align: top;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.report th {
  background: #281c59;
  color: #ffffff;
  font-weight: 700;
  text-align: center;
}
.report tr.alt td {
  background: #f8fafc;
}
.center {
  text-align: center;
}
.number {
  text-align: right;
  white-space: nowrap;
}
.status {
  font-weight: 700;
  text-align: center;
}
.status-success {
  background: #dcfce7 !important;
  color: #166534;
}
.status-warning {
  background: #fef9c3 !important;
  color: #854d0e;
}
.status-danger {
  background: #fee2e2 !important;
  color: #991b1b;
}
.status-info {
  background: #e0f2fe !important;
  color: #155e75;
}
.empty {
  color: #64748b;
  font-style: italic;
  padding: 16px;
  text-align: center;
}
.summary {
  width: 45%;
}
</style>
HTML;
    }

    private function columnGroup(array $columns): string
    {
        $totalWidth = array_sum(array_map(fn (array $column) => (float) ($column['width'] ?? 100), $columns));
        $totalWidth = $totalWidth > 0 ? $totalWidth : 1;
        $html = '<colgroup>';

        foreach ($columns as $column) {
            $percent = round(((float) ($column['width'] ?? 100) / $totalWidth) * 100, 2);
            $html .= '<col style="width: '.$percent.'%">';
        }

        return $html.'</colgroup>';
    }

    private function cellClass(array $column, mixed $value): string
    {
        if (in_array($column['key'] ?? '', ['payment_status', 'status'], true)) {
            return 'status '.$this->statusClass((string) $value);
        }

        if (($column['style'] ?? null) === 'Currency') {
            return 'number';
        }

        if (in_array($column['key'] ?? '', ['no', 'id_payment', 'booking_date', 'time_slot', 'payment_method'], true)) {
            return 'center';
        }

        return '';
    }

    private function statusClass(string $value): string
    {
        $status = strtolower($value);

        if (in_array($status, ['lunas', 'selesai'], true)) {
            return 'status-success';
        }

        if (in_array($status, ['dibatalkan', 'ditolak'], true)) {
            return 'status-danger';
        }

        if (str_contains($status, 'menunggu') || str_contains($status, 'verif') || str_contains($status, 'awal')) {
            return 'status-warning';
        }

        return 'status-info';
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

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
