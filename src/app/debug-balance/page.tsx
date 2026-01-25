
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DebugBalancePage() {
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
    });

    const totalIncome = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenseAll = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpensePaid = transactions
        .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
        .reduce((acc, t) => acc + t.amount, 0);

    const unpaidExpenses = transactions.filter(
        (t) => t.type === 'EXPENSE' && t.status !== 'PAID'
    );

    const balanceAll = totalIncome - totalExpenseAll;
    const balancePaid = totalIncome - totalExpensePaid;

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Balance Debugger</h1>

            <div className="grid gap-4 mb-8">
                <div className="p-4 border rounded">
                    <h2 className="font-bold">Summary</h2>
                    <p>Total Income: <span className="text-green-600">${totalIncome.toFixed(2)}</span></p>
                    <p>Total Expense (All): <span className="text-red-600">${totalExpenseAll.toFixed(2)}</span></p>
                    <p>Total Expense (Paid Only): <span className="text-red-600">${totalExpensePaid.toFixed(2)}</span></p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-bold">Balances</h2>
                    <p>Balance (All Expenses): <strong>${balanceAll.toFixed(2)}</strong> (Old History Logic)</p>
                    <p>Balance (Paid Only): <strong>${balancePaid.toFixed(2)}</strong> (Home Logic)</p>
                    <p>Difference: <strong>${(balancePaid - balanceAll).toFixed(2)}</strong></p>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-2">Unpaid Expenses ({unpaidExpenses.length})</h2>
            {unpaidExpenses.length > 0 ? (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2">Date</th>
                            <th className="py-2">Description</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unpaidExpenses.map((t) => (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="py-2">{t.date.toLocaleDateString()}</td>
                                <td className="py-2">{t.description}</td>
                                <td className="py-2 text-red-600">${t.amount.toFixed(2)}</td>
                                <td className="py-2">{t.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No unpaid expenses found.</p>
            )}
        </div>
    );
}
