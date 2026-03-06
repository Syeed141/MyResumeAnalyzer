import { useState, useEffect } from "react";

import {METRIC_CONFIG, buildPresenceChecklist } from "../constants"

import * as pdfjsLib from "pdfjs-dist"

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url"
// import { build } from './../node_modules/pdfjs-dist/types/src/display/api.d';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;




function App() {

  const [Aiready, SetAiready] = useState(false)
  const [IsLoading, SetIsLoading] = useState(false)
  const [UploadedFile, SetUploadedFile] = useState(null)
  const [Analysis, SetAnalysis] = useState(false)
  const [ResumeText, SetResumeText] = useState("")
  const [PresenceChecklist, SetPresenceChecklist] = useState([])



  useEffect(()=> {

    const interval = setInterval(()=>{


      if(window.puter?.ai?.chat) {

        SetAiready(true)
        clearInterval()
      }

    },300)


    return () => clearInterval(interval)


  },[])

  const extractPDFText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer
  }).promise;

  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1).then((page) =>
        page
          .getTextContent()
          .then((tc) => tc.items.map((i) => i.str).join(" "))
      )
    )
  );

  return texts.join("\n").trim();
};


const parseJSONResponse = (reply) => {
  try {
    const match = reply.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};

    if (!parsed.overallScore && !parsed.error) {
      throw new Error("Invalid AI response");
    }

    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }
};



const analyzeResume = async (text) => {
  const prompt = constants.ANALYZE_RESUME_PROMPT.replace(
    "{{DOCUMENT_TEXT}}",
    text
  );

  const response = await window.puter.ai.chat(
    [
      { role: "system", content: "You are an expert resume reviewer..." },
      { role: "user", content: prompt },
    ],
    {
      model: "gpt-4o",
    }
  );

  const result = parseJSONResponse(
    typeof response === "string"
      ? response
      : response.message?.content || ""
  );

  if (result.error) throw new Error(result.error);
  return result;
};
 

const handleFileUpload = async (e) => {
  const file = e.target.files[0];

  if (!file || file.type !== "application/pdf") {
    return alert("Please upload a PDF file only.");
  }

  SetUploadedFile(file);
  SetIsLoading(true);
  SetAnalysis(null);
  SetResumeText("");
  SetPresenceChecklist([]);

  try {
    const text = await extractPDFText(file);
    SetResumeText(text);
    SetPresenceChecklist(buildPresenceChecklist(text));
    SetAnalysis(await analyzeResume(text));
  } catch (err) {
    alert(`Error: ${err.message}`);
    reset();
  } finally {
    SetIsLoading(false);
  }
};

const reset = ()=> {


  SetUploadedFile(null);
  
  SetAnalysis(null);
  SetResumeText("");
  SetPresenceChecklist([]);

}


  return (
    <div className="min-h-screen bg-main-gradient p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <h1 className="text-7xl text-white">AI RESUME ANALYZER</h1>
    </div>
  );
}

export default App;
