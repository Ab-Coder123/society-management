import React from 'react';
import { colors, typography, spacing, radii } from '../styles/tokens';

export default function Table({
  columns = [], // Array of { key, header, render: (row) => node }
  data = [],
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  style = {},
}) {
  const tableContainerStyle = {
    width: '100%',
    overflowX: 'auto',
    borderRadius: radii.lg,
    border: `1px solid ${colors.border.default}`,
    backgroundColor: colors.background.surface,
    ...style,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizes.sm,
    textAlign: 'left',
  };

  const thStyle = {
    padding: `${spacing[3]} ${spacing[4]}`,
    backgroundColor: colors.background.subtle,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.semibold,
    borderBottom: `1px solid ${colors.border.default}`,
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: `${spacing[3]} ${spacing[4]}`,
    color: colors.text.primary,
    borderBottom: `1px solid ${colors.border.light}`,
    verticalAlign: 'middle',
  };

  const emptyStyle = {
    padding: spacing[8],
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: typography.fontSizes.sm,
  };

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} style={{ ...thStyle, ...col.headerStyle }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={emptyStyle}>
                Loading data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={emptyStyle}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  backgroundColor: rowIdx % 2 === 0 ? colors.background.surface : colors.neutral[50],
                  transition: 'background-color 0.15s ease-in-out',
                }}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} style={{ ...tdStyle, ...col.cellStyle }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
