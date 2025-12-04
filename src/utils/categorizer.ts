export const categorizeTransaction = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    // Public Transport
    if (lowerDesc.includes('bus/mrt') || lowerDesc.includes('transit')) {
        return 'Public Transport';
    }

    // Other Transport (Ride hailing, etc.)
    if (lowerDesc.includes('grab') || lowerDesc.includes('gojek') || lowerDesc.includes('tada') || lowerDesc.includes('ryde') || lowerDesc.includes('transport')) {
        return 'Other Transport';
    }

    // Subscriptions
    if (lowerDesc.includes('spotify') || lowerDesc.includes('amazon prime') || lowerDesc.includes('amzn') || lowerDesc.includes('chatgpt') || lowerDesc.includes('netflix') || lowerDesc.includes('youtube') || lowerDesc.includes('google one')) {
        return 'Subscriptions';
    }

    // Games
    if (lowerDesc.includes('clash of clans') || lowerDesc.includes('riot games') || lowerDesc.includes('epic games') || lowerDesc.includes('steam') || lowerDesc.includes('playstation') || lowerDesc.includes('xbox')) {
        return 'Games';
    }

    // Groceries
    if (lowerDesc.includes('ntuc') || lowerDesc.includes('fairprice') || lowerDesc.includes('supermarket') || lowerDesc.includes('shengsiong') || lowerDesc.includes('giant') || lowerDesc.includes('cold storage') || lowerDesc.includes('phoon huat')) {
        return 'Groceries';
    }

    // Food & Dining
    if (lowerDesc.includes('food') || lowerDesc.includes('restaurant') || lowerDesc.includes('cafe') || lowerDesc.includes('mcdonald') || lowerDesc.includes('kfc') || lowerDesc.includes('burger') || lowerDesc.includes('pizza') || lowerDesc.includes('starbucks') || lowerDesc.includes('wokhey') || lowerDesc.includes('wok hey') || lowerDesc.includes('subway') || lowerDesc.includes('jollibee') || lowerDesc.includes('wingstop') || lowerDesc.includes('tori-q') || lowerDesc.includes('nalan') || lowerDesc.includes('ijooz') || lowerDesc.includes('four leaves') || lowerDesc.includes('lavi-maxwell') || lowerDesc.includes('7-eleven') || lowerDesc.includes('mr coconut') || lowerDesc.includes('a hot hideout') || lowerDesc.includes('din tai fung') || lowerDesc.includes('astons') || lowerDesc.includes('ts/udon don bar')) {
        return 'Food & Dining';
    }

    // Overseas Expenditure
    if (lowerDesc.includes('revolut')) {
        return 'Overseas Expenditure';
    }

    // Transfers
    if (lowerDesc.includes('paynow') || lowerDesc.includes('transfer') || lowerDesc.includes('fast payment')) {
        return 'Transfers';
    }

    // Income
    if (lowerDesc.includes('salary') || lowerDesc.includes('interest') || lowerDesc.includes('dividend')) {
        return 'Income';
    }

    return 'Uncategorized';
};
