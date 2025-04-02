import  { useState, useRef, ChangeEventHandler,  useEffect, useCallback } from 'react';
import * as docx from 'docx-preview';
import {  applyNonDefaultStylesToInline, replaceTemplateCodes2, wrapPageInTbl } from './utils';
import { flettekoder } from './constants';

const DocxToHtmlUsingPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange:  ChangeEventHandler<HTMLInputElement> = async (event) => {
    console.log('File change event triggered');
    const file = event.target.files?.[0];
    console.log('File:', file);
    if (!file) return;

    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please upload a valid DOCX file.');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }
    setIsLoading(true);
    setError('');
    setFile(file);
  }
  const convert = useCallback(async () => {
    if (!containerRef.current || !file) return;
    try {
      console.log('starting conversion...');
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer:', arrayBuffer);
      // Clear previous content
      if (containerRef.current == null) return;
        containerRef.current.innerHTML = '';
      
        console.log('rendering document...');
      // Render the docx in the container with style preservation
      await docx.renderAsync(arrayBuffer, containerRef.current, undefined, {
        className: 'docx-viewer',
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true,
        renderChanges: false,
        renderComments: false,
        renderFootnotes: false,
        renderEndnotes: false,
        renderHeaders: false,
        renderFooters: false,
        ignoreFonts: true,
        trimXmlDeclaration: true,
      });
      
      // Get the HTML content for export if needed
      const htmlContent = containerRef.current?.innerHTML;
      const divArt = containerRef.current.querySelector('article')
      if (divArt){
      //divArt.innerHTML = replaceTemplateCodes(divArt?.innerHTML, flettekoder);
      replaceTemplateCodes2(divArt, flettekoder);
      applyNonDefaultStylesToInline(divArt);
      wrapPageInTbl(divArt);
      }
      console.log('HTML content available for export:', htmlContent?.substring(0, 100) + '...');
      
    } catch (err) {
      setError(`Error converting file: ${err}`);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    } finally {
      setIsLoading(false);
    }
}, [file, containerRef]);

useEffect(() => {
  if (file) {
    convert();
  }}, [file, convert]);

  const copyHtml = () => {
    if (!containerRef.current || !containerRef.current.innerHTML) {
        return;
        }
    const articleElem = containerRef.current.querySelector('article')
    const html = articleElem?.innerHTML || containerRef.current.innerHTML;
    navigator.clipboard.writeText(html).then(() => {
      alert('HTML copied to clipboard!');
    }
    ).catch(err => {
      console.error('Failed to copy: ', err);
    });
    }

  const downloadHtml = () => {
    if (!containerRef.current || !containerRef.current.innerHTML) {
      return;
    }
    
    // Create a full HTML document with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Converted Document</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .docx-viewer { width: 100%; }
          </style>
      </head>
      <body>
          ${containerRef.current.innerHTML}
      </body>
      </html>
    `;
    
    // Create download link
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Konverter dokumenter fra docx til HTML</h1>
        <p className="mb-4">Last opp et Word-dokument (.docx) for å konvertere det til HTML</p>
        
        <div className="flex items-center space-x-4">
          <label className="block">
            <span className="sr-only">Velg DOCX fil</span>
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
          
          <button
            onClick={downloadHtml}
            disabled={!containerRef.current?.innerHTML}
            className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Last ned som HTML
          </button>
          <button
            onClick={copyHtml}
            disabled={!containerRef.current?.innerHTML}
            className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Kopier HTML til utklippstavlen
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p>Konverterer dokument...</p>
        </div>
      )} 
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Forhåndsvisning</h2>
          <style>
            {`
              .docx-viewer {
                width: 210mm;
                min-height: 297mm;
                padding: 25mm;
                text-align: left;
              }
              table {
                width: 100% !important;
                }
            `}	
          </style>
          <div 
            ref={containerRef}
            className="p-4 border rounded-md bg-white min-h-64"
          />
        </div>
      
    </div>
  );
};

export default DocxToHtmlUsingPreview;