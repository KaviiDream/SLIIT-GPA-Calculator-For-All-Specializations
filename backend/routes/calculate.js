const express = require('express');
const router = express.Router();

//GPA Calculation logic

const GPA = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'E': 0.0,
  'F': 0.0
}

//Calculate GPA

router.post('/gpa', async (req, res) => {
  try {
    const { modules } = req.body; // Expecting an array of { credits, grade }
    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({ error: 'Invalid modules data' });
    }

    //Filter modules with valid grades
    const validModules = modules.filter(m => GPA.hasOwnProperty(m.grade) && m.credits > 0);

    //Calculate Gpa for each year

    const calculateYearGPA = (yearModules) => {
        const yearGrades = validModules.filter(m => m.year === yearModules);
        let totalPoints = 0;
        let totalCredits = 0;
    
        yearGrades.forEach(grade => {
          const gradePoint = GPA[grade.grade];
          totalPoints += gradePoint * grade.credits;
          totalCredits += grade.credits;
        })

        return {
        gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
        credits: totalCredits,
        count: yearGrades.length
      };
    };

    const year1GPA = calculateYearGPA(1);
    const year2GPA = calculateYearGPA(2);
    const year3GPA = calculateYearGPA(3);
    const year4GPA = calculateYearGPA(4);


    //Calculate CGPA

    let cgpaTotalPoints = 0;
    let cgpaTotalCredits = 0;

    validModules.forEach(grade => {
      const gradePoint = GPA[grade.grade];
      cgpaTotalPoints += gradePoint * grade.credits;
      cgpaTotalCredits += grade.credits;
    });

    const cgpa = cgpaTotalCredits > 0 ? cgpaTotalPoints / cgpaTotalCredits : 0;

    //Calculate WGPA

    const yearWeights = {1: 0.0, 2: 0.2, 3: 0.3, 4: 0.5};
    let weightedSum = 0;
    let totalWeight = 0;

    [year1GPA, year2GPA, year3GPA, year4GPA].forEach((yearGPA, index) => {
      const year = index + 1;
      if (yearGPA.credits > 0) {
        weightedSum += yearGPA.gpa * yearWeights[year];
        totalWeight += yearWeights[year];
      }
    });

    const wgpa = totalWeight > 0 ? weightedSum / totalWeight : 0;


    res.json({
        yearGPAs:{
            year1: year1GPA.gpa.toFixed(2),
            year2: year2GPA.gpa.toFixed(2),
            year3: year3GPA.gpa.toFixed(2),
            year4: year4GPA.gpa.toFixed(2)
        },

        yearCredits:{
            year1: year1GPA.credits,
            year2: year2GPA.credits,
            year3: year3GPA.credits,
            year4: year4GPA.credits
        },

        cgpa: cgpa.toFixed(2),
        wgpa: wgpa.toFixed(2),
        totalCredits: cgpaTotalCredits,
        totalModules: validModules.length
    });


    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;