const { UserEducationSystem } = require('./user-education-system.js');

console.log('🧪 Testing Educational Response System\n');

const testCases = [
  'I forgot my password, help me please',
  'Where can I create an experience?',
  'How do I upload a profile picture?',
  'Cannot find the dashboard, where is it?',
  'What does this error message mean?',
  'How do I reset my account?',
  'Browser is not working properly',
  'Mobile app looks different'
];

testCases.forEach((issue, i) => {
  console.log(`📝 Test ${i+1}: "${issue}"`);
  try {
    const response = UserEducationSystem.generateEducationalResponse(issue, {
      category: 'USER_EDUCATION_RESPONSE',
      confidence: 0.9,
      patterns: ['help', 'where', 'how']
    });
    console.log(`💬 Response:\n${response}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('=' .repeat(60));
});
