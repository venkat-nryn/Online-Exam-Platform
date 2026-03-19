const XLSX = require('xlsx');

const parseExcelQuestions = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const questions = data.map((row, index) => {
    // Validate required fields
    if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectAnswer || !row.Marks) {
      throw new Error(`Missing required fields in row ${index + 2}`);
    }

    // Validate correct answer
    if (!['A', 'B', 'C', 'D'].includes(row.CorrectAnswer)) {
      throw new Error(`Invalid correct answer in row ${index + 2}. Must be A, B, C, or D`);
    }

    // Validate marks
    if (isNaN(row.Marks) || row.Marks < 0) {
      throw new Error(`Invalid marks in row ${index + 2}`);
    }

    return {
      question: row.Question,
      options: {
        A: row.OptionA,
        B: row.OptionB,
        C: row.OptionC,
        D: row.OptionD
      },
      correctAnswer: row.CorrectAnswer,
      marks: parseFloat(row.Marks)
    };
  });

  return questions;
};

const generateExcelReport = (data, headers, fileName) => {
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseExcelQuestions,
  generateExcelReport
};