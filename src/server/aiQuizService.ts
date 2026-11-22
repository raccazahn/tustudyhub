
export async function generateAndValidateQuiz(params: any) {
    console.log('🤖 [MOCK] AI generation bypassed for local V1 stability.');
    await new Promise(r => setTimeout(r, 500));
    return {
        title: params.topic + ' Assessment',
        description: 'Generated locally.',
        timeLimitMinutes: 30,
        passPercentage: 70,
        questions: [],
        validationReport: { isValid: true, validQuestionsCount: 0, warnings: [] },
        rawSource: 'MOCK'
    };
}
