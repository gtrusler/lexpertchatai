import React, { useRef } from 'react';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
  uploadedFiles?: File[];
  onRemoveFile?: (fileName: string) => void;
  multiple?: boolean;
  accept?: string;
  buttonOnly?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  uploadedFiles = [],
  onRemoveFile,
  multiple = true,
  accept = '.pdf,.doc,.docx,.txt',
  buttonOnly = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
        accept={accept}
      />

      {buttonOnly ? (
        <button
          type="button"
          onClick={triggerFileInput}
          className="p-2 rounded-full hover:bg-gray-100"
          title="Upload file"
        >
          <PaperClipIcon className="h-5 w-5 text-gray-500" />
        </button>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-gray-700">
              <button
                type="button"
                onClick={triggerFileInput}
                className="text-primary font-medium hover:underline"
              >
                Click to upload
              </button>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">
              PDF, Word, or text files
            </p>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                <span className="truncate">{file.name}</span>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.name)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 