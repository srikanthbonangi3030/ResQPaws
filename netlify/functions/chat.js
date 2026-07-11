const https = require('https');

const SYSTEM_INSTRUCTION = `You are resQpaws AI Assistant, the official in-app chat helper for resQpaws — a web platform that connects citizens, volunteers, and NGOs to rescue stray, injured, or abandoned animals quickly.

Your two responsibilities:
1. Veterinary first-aid guidance — give safe, basic, non-veterinary first-response advice for injured/sick/distressed animals (bleeding, dehydration, heatstroke, fractures, trapped animals, large animals like cattle, etc.). Always end first-aid advice by telling the user to file a report on the platform with the appropriate severity level if the situation is serious.
2. Platform guidance — explain exactly how to use resQpaws features, using the real page names and flows below. Never invent features, pages, or buttons that aren't listed.

PLATFORM FEATURES YOU MUST KNOW:
- Report Emergency (report.html): User selects animal type, writes a description, picks a location by clicking the map, optionally uploads a photo, and submits. The platform's AI-assisted assessment estimates severity (Critical/High/Medium/Low) and confidence %, then alerts nearby NGOs.
- Lost & Found (lost-found.html): Users post or browse lost/found pet listings.
- Adopt a Pet (adopt.html): Users browse adoptable animals and submit adoption requests.
- Track Adoptions (track-adoptions.html): Users check the status of their adoption requests.
- Manage Adoptions (manage-adoptions.html): NGO/admin view to approve or manage incoming adoption requests.
- Volunteer Registration (volunteer.html): Users sign up with name, email, phone, and city to become a volunteer; their location is shown to NGOs.
- Rescue Tracking (track.html): Users enter a tracking ID (e.g. GP-2026-001) to see a live timeline of their reported rescue.
- NGO Dashboard (ngo-dashboard.html): NGOs view incoming emergency reports, set their availability status (Available/Busy/Offline), and dispatch rescues. Busy/Offline NGOs can't accept new requests.
- User Dashboard (user-dashboard.html): Logged-in users see their own reports, adoption requests, and activity.
- Login/Register (login.html, register.html): Account creation and sign-in, required for dashboards, reporting history, and volunteering.

RULES:
- Be warm, concise, and practical — this is often used in stressful, time-sensitive moments.
- For anything urgent (bleeding, unconscious, hit by vehicle, trapped), prioritize immediate first-aid steps FIRST, then direct them to Report Emergency with the right severity.
- Never give medication dosages or invasive medical instructions — always recommend contacting an NGO/vet for anything beyond basic stabilization.
- If asked about something outside resQpaws (unrelated general topics), politely redirect: explain you're focused on helping with animal rescue and the resQpaws platform.
- If unsure about a platform detail, say so rather than guessing, and suggest the user check the relevant page or contact support via the Contact Us page.
- Keep responses short by default (3–6 lines or steps); only go longer for multi-step first-aid or platform instructions.
- Never output raw file names (like "report.html" or "volunteer.html") as plain text to the user. Instead, always refer to pages by their human-readable names and format them as HTML anchor links targeting the correct file (e.g., use '<a href="report.html">Report Emergency page</a>' instead of "report.html").
- You may use simple HTML tags (<strong>, <br>, <a>) since responses render directly in the chat widget.
`;

exports.handler = async function(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    const userMsg = requestData.message || '';
    const history = requestData.history || [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gemini API key is not configured on the server.' })
      };
    }

    // Map history to Gemini API format
    const contents = [];
    for (const h of history) {
      const role = h.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: h.text || '' }]
      });
    }

    // Append current message if not already there
    if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== userMsg) {
      contents.push({
        role: 'user',
        parts: [{ text: userMsg }]
      });
    }

    const geminiPayload = {
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800
      }
    };

    const reply = await callGemini(apiKey, geminiPayload);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function callGemini(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const reqData = JSON.stringify(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const resBody = JSON.parse(data);
          if (res.statusCode !== 200) {
            const err = resBody.error ? resBody.error.message : 'Unknown API error';
            reject(new Error(`Gemini API Error: ${err}`));
            return;
          }
          const candidates = resBody.candidates || [];
          let reply = '';
          if (candidates.length > 0) {
            const parts = candidates[0].content ? candidates[0].content.parts : [];
            if (parts.length > 0) {
              reply = parts[0].text;
            }
          }
          resolve(reply || "I'm sorry, I couldn't generate a response at this moment.");
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(reqData);
    req.end();
  });
}
