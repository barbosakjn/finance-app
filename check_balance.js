
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalance() {
    try {
        const transactions = await prisma.transaction.findMany();

        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpenseAll = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpensePaid = transactions
            .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
            .reduce((acc, t) => acc + t.amount, 0);

        const unpaidExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.status !== 'PAID');

        console.log('--- DIAGNOSTIC RESULT ---');
        console.log(`Total Income: $${totalIncome.toFixed(2)}`);
        console.log(`Total Expense (All): $${totalExpenseAll.toFixed(2)}`);
        console.log(`Total Expense (Paid Only): $${totalExpensePaid.toFixed(2)}`);
        console.log('-------------------------');
        console.log(`Balance (All Expenses): $${(totalIncome - totalExpenseAll).toFixed(2)}`);
        console.log(`Balance (Paid Only - HOME): $${(totalIncome - totalExpensePaid).toFixed(2)}`);
        console.log('-------------------------');
        console.log(`Difference: $${(totalExpenseAll - totalExpensePaid).toFixed(2)}`);
        console.log(`Unpaid Expenses Count: ${unpaidExpenses.length}`);

        if (unpaidExpenses.length > 0) {
            console.log('Unpaid Expenses List:');
            unpaidExpenses.forEach(t => {
                console.log(`- ${t.description}: $${t.amount.toFixed(2)} (Status: ${t.status})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBalance();
