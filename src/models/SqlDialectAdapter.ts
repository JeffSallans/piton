export interface SqlDialectAdapter {
    setupConnection: (connectionString: string) => Promise<void>,
    closeConnection: () => Promise<void>,
    executeSQL: (query: string) => Promise<void>,
    countSQL: (query: string) => Promise<number | null>,
    querySQL: (query: string) => Promise<any[]>,
}