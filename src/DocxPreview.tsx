import {
  useState,
  useRef,
  ChangeEventHandler,
  useEffect,
  useCallback,
} from "react";
import * as docx from "docx-preview";
import {
  allTablesFullWidth,
  applyNonDefaultStylesToInline,
  removeFontFamily,
  replaceTemplateCodes2,
  wrapPageInTbl
} from "./utils";
import { flettekoder, signatureFields } from "./constants";
import Checkbox from "./Checkbox";
import { RadioGroup } from "./Radiobtn";

const DocxToHtmlUsingPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fullWidthTables, setFullWidthTables] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [signatureChoice, setSignatureChoice] = useState("0");
  const [stripFontFamilies, setStripFontFamilies] = useState(true);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    console.log("File change event triggered");
    const file = event.target.files?.[0];
    console.log("File:", file);
    if (!file) return;

    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setError("Please upload a valid DOCX file.");
      if (containerRef) {
        containerRef.innerHTML = "";
      }
      return;
    }
    setIsLoading(true);
    setError("");
    setFile(file);
  };
  const convert = useCallback(async () => {
    if (!containerRef || !file) return;
    try {
      setError("");
      console.log("starting conversion...");
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log("ArrayBuffer:", arrayBuffer);
      // Clear previous content
      if (containerRef == null) return;
      containerRef.innerHTML = "";

      console.log("rendering document...");
      // Render the docx in the container with style preservation
      await docx.renderAsync(arrayBuffer, containerRef, undefined, {
        className: "docx-viewer",
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
      const htmlContent = containerRef.innerHTML;
      const divArt = containerRef.querySelector("article");
      if (divArt) {
        //divArt.innerHTML = replaceTemplateCodes(divArt?.innerHTML, flettekoder);
        replaceTemplateCodes2(divArt, flettekoder);
        if (signatureChoice !== "0" && signatureChoice in signatureFields) {
          const signatureHtml = signatureFields[signatureChoice];
          divArt.innerHTML += signatureHtml;
        }
        if (fullWidthTables) {
          allTablesFullWidth(divArt);
        }
        applyNonDefaultStylesToInline(divArt);
        const tblElem = wrapPageInTbl(divArt);
        console.log("wrap ok", tblElem)
        if (stripFontFamilies) {
          console.log("stripping fonts...")
          removeFontFamily(tblElem)
        }
      }
      console.log(
        "HTML content available for export:",
        htmlContent?.substring(0, 100) + "..."
      );
    } catch (err) {
      setError(`Error converting file: ${err}`);
      if (containerRef) {
        containerRef.innerHTML = "";
      }
    } finally {
      setIsLoading(false);
    }
  }, [containerRef, file, fullWidthTables, signatureChoice]);

  useEffect(() => {
    if (file) {
      convert();
    }
  }, [file, convert]);

  const copyHtml = () => {
    if (!containerRef || !containerRef.innerHTML) {
      return;
    }
    const articleElem = containerRef.querySelector("article");
    const html = articleElem?.innerHTML || containerRef.innerHTML;
    navigator.clipboard
      .writeText(html)
      .then(() => {
        alert("HTML copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const downloadHtml = () => {
    if (!containerRef || !containerRef.innerHTML) {
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
          ${containerRef.innerHTML}
      </body>
      </html>
    `;

    // Create download link
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const iframeLoad = () => {
    if (iframeRef?.current) {
      const iframeDocument = iframeRef.current.contentDocument;
      setContainerRef(iframeDocument?.body as HTMLDivElement);
    }
  };

  const signatureOptions = [
    { label: "Ingen", value: "0" },
    { label: "2 signaturer", value: "2" },
    { label: "3 signaturer", value: "3" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          Konverter dokumenter fra docx til HTML
        </h1>
        <p className="mb-4">
          Last opp et Word-dokument (.docx) for å konvertere det til HTML
        </p>

        <div className="grid grid-cols-2 grid-rows-1 gap-4">
          {/* Top-left cell */}
          <div className="col-span-1">
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
        file:bg-blue-50 file:text-blue-700 mb-2
        hover:file:bg-blue-100 cursor-pointer file:cursor-pointer"
              />
            </label>
            <div className="mb-2">
            <Checkbox
              label="Endre tabeller til full bredde"
              initialChecked={fullWidthTables}
              onChange={setFullWidthTables}
            />
            </div>
            <div className="mb-2">
            <Checkbox
              label="Fjern skrifttype (familie)"
              initialChecked={stripFontFamilies}
              onChange={setStripFontFamilies}
            />
            </div>
            <div className="mb-2">
            <RadioGroup
              name="signature-options"
              label="Legg til signaturfelt"
              options={signatureOptions}
              value={signatureChoice}
              onChange={setSignatureChoice}
            />
            </div>
          </div>

          {/* Top-right cell */}
          <div className="col-span-1">
            <button
              onClick={downloadHtml}
              disabled={!containerRef?.innerHTML}
              className={`
        w-full py-2 px-4 
        bg-blue-600 hover:bg-blue-300 
        text-white rounded-md disabled:opacity-50 mb-2
        ${!containerRef?.innerHTML ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              Last ned som HTML
            </button>
            <button
              onClick={copyHtml}
              disabled={!containerRef?.innerHTML}
              className={`
        w-full py-2 px-4 
        bg-blue-600 hover:bg-blue-300 
        text-white rounded-md disabled:opacity-50 
        ${!containerRef?.innerHTML ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              Kopier HTML til utklippstavlen
            </button>
          </div>

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
      <div className="mt-8 h-full">
        <h2 className="text-xl font-bold mb-4">Forhåndsvisning</h2>
        <div className="p-4 border rounded-md bg-white h-full w-full">
          <iframe
            ref={iframeRef}
            onLoad={iframeLoad}
            width="100%"
            height={"100%"}
            srcDoc={`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Converted Document</title>
        <style>
          
              .docx-viewer {
                width: 210mm !important;
                min-height: 297mm;
                padding: 25mm !important;
                text-align: left;
              }
            
        </style>
        </head>
        <body>
        </body>
        </html>
        `}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default DocxToHtmlUsingPreview;
