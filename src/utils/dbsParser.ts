import type { Transaction } from '../types';
import { categorizeTransaction } from './categorizer';

export const parseDBSStatement = (text: string): Transaction[] => {
    const transactions: Transaction[] = [];
    const lines = text.split('\n');
    let currentBalance = 0;

    const balanceForwardRegex = /Balance Brought Forward.*?([A-Z]{3})?\s*([\d,]+\.\d{2})/;
    const dateRegex = /^(\d{2}\/\d{2}\/\d{4})/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.trim();

        // Check for Balance Brought Forward
        const balanceMatch = cleanLine.match(balanceForwardRegex);
        if (balanceMatch) {
            const balanceStr = balanceMatch[2];
            currentBalance = parseFloat(balanceStr.replace(/,/g, ''));
            continue;
        }

        // Check for Transaction line
        const dateMatch = cleanLine.match(dateRegex);
        if (dateMatch) {
            const date = dateMatch[0];
            const rest = cleanLine.substring(date.length).trim();
            const numbers = rest.match(/([\d,]+\.\d{2})/g);

            if (numbers && numbers.length > 0) {
                const newBalanceStr = numbers[numbers.length - 1];
                const newBalance = parseFloat(newBalanceStr.replace(/,/g, ''));

                const firstAmount = numbers[0];
                const firstNumIndex = rest.indexOf(firstAmount);
                let description = rest.substring(0, firstNumIndex).trim();

                // Look ahead for multi-line description
                // We continue adding lines until we hit a new date, empty line, balance forward, or footer text
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (!nextLine ||
                        nextLine.match(dateRegex) ||
                        nextLine.match(balanceForwardRegex) ||
                        nextLine.includes("Balance Carried Forward") ||
                        nextLine.includes("Total Balance Carried Forward") ||
                        nextLine.includes("Transaction Details as of") ||
                        nextLine.match(/Page \d+ of \d+/)
                    ) {
                        break;
                    }
                    // Append next line to description
                    description += " " + nextLine;
                    j++;
                }
                // Skip the lines we just consumed
                // i = j - 1; // Actually, let's not skip, because the loop increments i. 
                // But if we consumed lines, we should skip them.
                // However, the loop will check them for dateRegex and fail, effectively skipping them.
                // But it's safer to skip.
                // Wait, if nextLine matches dateRegex, we break. So we process it in next iteration.
                // If it doesn't match, we consumed it.
                // So we should set i to j - 1.
                // But we need to be careful not to skip valid lines if our check is wrong.
                // Our check is: !nextLine || dateRegex || balanceForwardRegex.
                // So if it IS a description line, we consume it.

                // Let's just append. The main loop will re-check lines, but since they won't match dateRegex, they will be ignored.
                // EXCEPT if they match Balance Forward. But we check that in the while loop.

                const diff = newBalance - currentBalance;
                const roundedDiff = Math.round(diff * 100) / 100;

                let withdrawal = 0;
                let deposit = 0;

                if (roundedDiff < 0) {
                    withdrawal = Math.abs(roundedDiff);
                } else {
                    deposit = roundedDiff;
                }

                let sender: string | undefined;
                if (deposit > 0 && description.includes("FROM:")) {
                    // Match everything after "FROM:"
                    const fromPart = description.split("FROM:")[1].trim();

                    // List of words that signal the end of the name
                    const stopWords = ["TRANSFER", "PAYNOW", "MOBILE", "FOR", "TO", "OTHR", "OTHER", "REF", "UBP"];

                    // Specific known names to match exactly (longest first to avoid partial matches)
                    const knownNames = [
                        "SUBASH CHANDRA BOSE SWATI",
                        "VARSHA RAMKUMAR",
                        "APPANA JISHNU",
                        "SINDHU MOHAN",
                        "DEEPAK S/O ALAGUSUBRAMANIAN",
                        "DEEPANKUR JOHN NJONDIMACKAL"
                    ];

                    // Check if it starts with a known name
                    const matchedName = knownNames.find(name => fromPart.startsWith(name));
                    if (matchedName) {
                        sender = matchedName;
                    } else {
                        // Find the earliest occurrence of any stop word or character
                        let nameEndIndex = fromPart.length;

                        // Check for hyphen
                        const hyphenIndex = fromPart.indexOf("-");
                        if (hyphenIndex !== -1 && hyphenIndex < nameEndIndex) {
                            nameEndIndex = hyphenIndex;
                        }

                        for (const word of stopWords) {
                            const index = fromPart.indexOf(" " + word); // Ensure we match whole words (preceded by space)
                            if (index !== -1 && index < nameEndIndex) {
                                nameEndIndex = index;
                            }
                        }

                        sender = fromPart.substring(0, nameEndIndex).trim();
                    }
                }

                transactions.push({
                    date,
                    description,
                    withdrawal,
                    deposit,
                    balance: newBalance,
                    category: categorizeTransaction(description),
                    sender
                });

                currentBalance = newBalance;
            }
        }
    }

    return transactions;
};
