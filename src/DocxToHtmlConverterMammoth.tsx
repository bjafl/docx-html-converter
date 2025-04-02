import  { ChangeEventHandler, useState } from 'react';
import * as mammoth from 'mammoth';

const DocxToHtmlConverter = () => {
  const [htmlOutput, setHtmlOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please upload a valid DOCX file.');
      setHtmlOutput('');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert the DOCX to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlOutput(result.value);
      
      // Log any warnings
      if (result.messages.length > 0) {
        console.warn('Conversion warnings:', result.messages);
      }
    } catch (err) {
      setError(`Error converting file: ${err}`);
      setHtmlOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">DOCX to HTML Converter</h1>
        <p className="mb-4">Upload a Word document (.docx) to convert it to HTML</p>
        
        <div className="flex items-center space-x-4">
          <label className="block">
            <span className="sr-only">Choose DOCX file</span>
            <input 
              type="file" 
              accept=".docx" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Converting document...</p>
        </div>
      ) : htmlOutput ? (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">HTML Output</h2>
          <div className="mb-4 p-4 border rounded-md bg-gray-50 max-h-96 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">{htmlOutput}</pre>
          </div>
          <iframe 
            className="w-full h-96 border rounded-md"
            srcDoc={htmlOutput}
            title="Converted HTML Output" />
        </div>
      ) : null}
    </div>
  );
};

export default DocxToHtmlConverter;