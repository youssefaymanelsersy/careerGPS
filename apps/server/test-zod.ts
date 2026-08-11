import { responseBodySchema } from './src/modules/cv/parsedCv_schema';

const testData = {
  cvId: '123e4567-e89b-12d3-a456-426614174000',
  status: 'completed',
  parsedData: {
    fullName: null,
    email: null,
    phone: null,
    location: null,
    summary: null,
    skills: { technical: [], nonTechnical: [] },
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
    links: { github: null, linkedin: null, portfolio: null }
  }
};

const result = responseBodySchema.safeParse(testData);
console.log("Dummy PDF Parse Result:", result.success ? "SUCCESS" : JSON.stringify(result.error.issues, null, 2));

async function runRealTest() {
    const res = await fetch('https://cv-ai-microservice.onrender.com/parse', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cvId: '123e4567-e89b-12d3-a456-426614174000', url: 'https://cdn.filestackcontent.com/wcrjf9qPTCKXV3hMXnKj' }) 
    });
    const realData = await res.json();
    const realResult = responseBodySchema.safeParse(realData);
    console.log("Real PDF Parse Result:", realResult.success ? "SUCCESS" : JSON.stringify(realResult.error.issues, null, 2));
}

runRealTest();
