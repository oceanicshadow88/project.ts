import React from 'react';
import type { IApiTokenRecord } from '../../../../../types/serviceAccount';
import styles from './ApiTokenTable.module.scss';

interface IApiTokenTableProps {
  apiTokens: IApiTokenRecord[];
}

export default function ApiTokenTable({ apiTokens }: Readonly<IApiTokenTableProps>) {
  if (apiTokens.length === 0) {
    return <p className={styles.emptyState}>Create an API token to connect to the MCP server</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.tokenTable} aria-label="API token records">
        <thead>
          <tr>
            <th>Name</th>
            <th>Created by</th>
            <th>Last used</th>
            <th>Expires</th>
            <th>Revoke</th>
          </tr>
        </thead>
        <tbody>
          {apiTokens.map((token) => (
            <tr key={token.id}>
              <td title={token.name}>{token.name}</td>
              <td title={token.createdBy}>{token.createdBy}</td>
              <td>
                {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : 'Never'}
              </td>
              <td>Never</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
