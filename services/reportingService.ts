import type { Project, CustomReport, CannedReportId, Expense, DailyLog, ManagedRfiItem, InspectionRequest } from '../types';

// This function processes both custom and canned reports by normalizing the config
type ReportableData = Expense | DailyLog | ManagedRfiItem | InspectionRequest;

export const processReport = (project: Project, config: CustomReport | { id: CannedReportId }) => {
    let reportConfig: CustomReport;

    // If it's a canned report, create its config on the fly
    if ('id' in config && !('dataSource' in config)) {
        reportConfig = getCannedReportConfig(config.id);
    } else {
        reportConfig = config as CustomReport;
    }
    
    // 1. Get Base Data
    let data: ReportableData[];
    switch(reportConfig.dataSource) {
        case 'expenses':
            data = [...project.expenses];
            break;
        case 'dailyLogs':
            data = [...project.dailyLogs];
            break;
        case 'rfiManager':
            data = [...project.rfiManager.managedRfis];
            break;
        case 'inspections':
            data = [...project.inspections];
            break;
        default:
            data = [];
    }

    // 2. Apply Filters
    let filteredData = data;
    if (reportConfig.filters && reportConfig.filters.length > 0) {
        filteredData = data.filter(row => {
            return reportConfig.filters.every(filter => {
                const rowValue = (row as any)[filter.field];
                if (rowValue === undefined || rowValue === null) return false;

                switch (filter.operator) {
                    case 'equals': return rowValue == filter.value;
                    case 'not_equals': return rowValue != filter.value;
                    case 'contains': return String(rowValue).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'greater_than': return rowValue > filter.value;
                    case 'less_than': return rowValue < filter.value;
                    case 'is_between': {
                        const value = filter.value;
                        if (Array.isArray(value) && value.length === 2) {
                            const date = new Date(rowValue);
                            const start = new Date(value[0]);
                            const end = new Date(value[1]);
                            return date >= start && date <= end;
                        }
                        return false;
                    }
                    default: return true;
                }
            });
        });
    }

    // 3. Apply Grouping and Aggregation
    if (reportConfig.grouping && reportConfig.grouping.field) {
        const { field, aggregation, aggField } = reportConfig.grouping;

        const groups = filteredData.reduce((acc, row) => {
            const groupKey = String((row as any)[field]);
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(row);
            return acc;
        }, {} as Record<string, ReportableData[]>);

        const groupedData = Object.entries(groups).map(([groupName, items]) => {
            let aggregatedValue = 0;
            switch(aggregation) {
                case 'count':
                    aggregatedValue = items.length;
                    break;
                case 'sum':
                    aggregatedValue = items.reduce((sum, item) => sum + (Number((item as any)[aggField]) || 0), 0);
                    break;
                case 'avg':
                    const sum = items.reduce((s, item) => s + (Number((item as any)[aggField]) || 0), 0);
                    aggregatedValue = items.length > 0 ? sum / items.length : 0;
                    break;
            }
            return {
                [field]: groupName,
                [aggField]: aggregatedValue,
            };
        });

        return {
            title: reportConfig.name,
            columns: [field, aggField],
            rows: groupedData,
            isGrouped: true,
            grouping: reportConfig.grouping,
        };
    }

    // 4. Return plain, filtered data
    return {
        title: reportConfig.name,
        columns: reportConfig.fields,
        rows: filteredData,
        isGrouped: false,
    };
};

const getCannedReportConfig = (id: CannedReportId): CustomReport => {
    switch(id) {
        case 'expenseByCategory':
            return {
                id: 'canned-expenseByCategory',
                name: 'Expense by Category',
                dataSource: 'expenses',
                fields: ['category', 'amount'],
                filters: [],
                grouping: {
                    field: 'category',
                    aggregation: 'sum',
                    aggField: 'amount',
                }
            };
        case 'rfiLog':
             return {
                id: 'canned-rfiLog',
                name: 'Full RFI Log',
                dataSource: 'rfiManager',
                fields: ['status', 'subject', 'question', 'answer'],
                filters: [],
            };
        case 'billableExpenses':
            return {
                id: 'canned-billableExpenses',
                name: 'Uninvoiced Billable Expenses',
                dataSource: 'expenses',
                fields: ['date', 'vendor', 'description', 'amount'],
                filters: [
                    { id: 'f1', field: 'invoicable', operator: 'equals', value: true },
                    { id: 'f2', field: 'status', operator: 'equals', value: 'Pending' },
                ],
            };
        default: // financialSummary is handled separately as it's not based on a single data source
            throw new Error(`Canned report config not found for id: ${id}`);
    }
};