export const saveScore = async (gameName: string, score: number, userName: string) => {
    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_name: gameName,
                score: score,
                user_name: userName,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save score');
        }

        const data = await response.json();
        console.log('Score saved:', data);
        return data;
    } catch (error) {
        console.error('Error saving score:', error);
        return false;
    }
};

export const getHighScore = async (gameName: string): Promise<number> => {
    try {
        const response = await fetch(`/api/scores/${encodeURIComponent(gameName)}`);
        if (!response.ok) throw new Error('Failed to fetch scores');
        const scores = await response.json();
        if (scores && scores.length > 0) {
            return scores[0].score;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching high score:', error);
        return 0;
    }
};
