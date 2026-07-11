// GuardianPulse AI-Assisted Assessment (Demo) Engine
// Simulates an AI vision analysis of the uploaded animal image and returns realistic injury metrics based on description hints.

const GPAI = {
  // Analyzes description text and maps to realistic severity tags
  analyzeIncidentDemo: async function(animalType, description, imageFile) {
    return new Promise((resolve) => {
      // Simulate network request/inference delay (1.5 seconds)
      setTimeout(() => {
        const descLower = description.toLowerCase();
        
        let severity = "Medium";
        let confidence = Math.floor(Math.random() * (96 - 82 + 1)) + 82; // 82% to 96%
        let aiDetails = {
          injuryDetected: "No obvious external cuts",
          bloodVisible: "No",
          condition: "Stable, but needs inspection",
          mobilityIssue: "No",
          distressLevel: "Medium"
        };

        // Rule-based simulation matching description keywords
        if (descLower.includes("bleeding") || descLower.includes("blood") || descLower.includes("cut") || descLower.includes("wound")) {
          aiDetails.injuryDetected = "Yes (Open bleeding wound)";
          aiDetails.bloodVisible = "Yes (Visible)";
        }
        
        if (descLower.includes("limping") || descLower.includes("walk") || descLower.includes("fracture") || descLower.includes("broken") || descLower.includes("run")) {
          aiDetails.mobilityIssue = "Yes (Impaired limb movement)";
          aiDetails.condition = "Limping, distress during mobility";
        }

        if (descLower.includes("stuck") || descLower.includes("trapped") || descLower.includes("fence") || descLower.includes("drain")) {
          aiDetails.mobilityIssue = "Yes (Immobilized / Trapped)";
          aiDetails.distressLevel = "High";
        }

        // Calculate severity level
        if (descLower.includes("dying") || descLower.includes("unconscious") || descLower.includes("hit by car") || descLower.includes("accident") || (descLower.includes("bleeding") && descLower.includes("cannot walk"))) {
          severity = "Critical";
          aiDetails.distressLevel = "Very High";
          aiDetails.condition = "Severe trauma, immediate emergency care required";
          confidence = Math.floor(Math.random() * (98 - 90 + 1)) + 90; // 90% to 98%
        } else if (descLower.includes("bleeding") || descLower.includes("broken leg") || descLower.includes("abused") || descLower.includes("injured")) {
          severity = "High";
          aiDetails.distressLevel = "High";
          aiDetails.condition = "Significant injury, stable but urgent intervention needed";
        } else if (descLower.includes("sick") || descLower.includes("skin") || descLower.includes("mange") || descLower.includes("weak") || descLower.includes("dehydrated")) {
          severity = "Medium";
          aiDetails.distressLevel = "Medium";
          aiDetails.condition = "Malnourished or showing signs of illness";
        } else {
          severity = "Low";
          aiDetails.distressLevel = "Low";
          aiDetails.condition = "Healthy appearance, observation advised";
        }

        resolve({
          severity,
          confidence,
          aiDetails
        });
      }, 1500);
    });
  }
};

window.GPAI = GPAI;
