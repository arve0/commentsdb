exports.question = 'Hva er en pluss tre?';
exports.correctAnswer = (answer) => {
  answer = answer.trim();
  return answer === 'fire' || answer == '4';
};
