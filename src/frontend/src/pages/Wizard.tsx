import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { CheckIcon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
}

interface WizardData {
  caseName: string;
  templateId: string | null;
  characters: Character[];
  jurisdiction: string;
  court: string;
  opposingCounsel: string;
  objectives: string;
  files: File[];
  fileTags: Record<string, string[]>;
  goal: string;
}

const Wizard: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardData, setWizardData] = useState<WizardData>({
    caseName: '',
    templateId: templateId || null,
    characters: [{ id: '1', name: '', role: '' }],
    jurisdiction: '',
    court: '',
    opposingCounsel: '',
    objectives: '',
    files: [],
    fileTags: {},
    goal: ''
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // In a real implementation, this would be an actual Supabase query
        // For now, we'll use mock data
        
        // Mock templates data
        const mockTemplates: Template[] = [
          {
            id: '1',
            name: 'Texas Family Code Bot',
            description: 'Specialized for family law cases in Texas'
          },
          {
            id: '2',
            name: 'Trademark Bot',
            description: 'Handles trademark office actions and responses'
          }
        ];
        
        setTemplates(mockTemplates);
        
        if (templateId) {
          const selectedTemplate = mockTemplates.find(t => t.id === templateId) || null;
          setTemplate(selectedTemplate);
          setWizardData(prev => ({
            ...prev,
            templateId: templateId
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [templateId]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const handleFinish = () => {
    // In a real implementation, this would save the data to Supabase
    console.log('Wizard data:', wizardData);
    
    // Create a new bot ID (would be returned from the backend in a real implementation)
    const newBotId = Date.now().toString();
    
    // Create a new assistant object
    const newAssistant = {
      id: newBotId,
      name: wizardData.caseName || 'Unnamed Assistant',
      updated_at: new Date().toISOString(),
      status: 'New',
      template_id: wizardData.templateId || '',
      docs_count: wizardData.files.length,
      responses_count: 0,
      token_usage: 0
    };
    
    // Save to localStorage
    const savedAssistants = JSON.parse(localStorage.getItem('userAssistants') || '[]');
    savedAssistants.push(newAssistant);
    localStorage.setItem('userAssistants', JSON.stringify(savedAssistants));
    
    // Navigate to the chat page for the new bot
    navigate(`/chat/${newBotId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWizardData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCharacterChange = (id: string, field: 'name' | 'role', value: string) => {
    setWizardData(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === id ? { ...char, [field]: value } : char
      )
    }));
  };

  const addCharacter = () => {
    const newId = (wizardData.characters.length + 1).toString();
    setWizardData(prev => ({
      ...prev,
      characters: [...prev.characters, { id: newId, name: '', role: '' }]
    }));
  };

  const removeCharacter = (id: string) => {
    if (wizardData.characters.length > 1) {
      setWizardData(prev => ({
        ...prev,
        characters: prev.characters.filter(char => char.id !== id)
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setWizardData(prev => ({
        ...prev,
        files: [...prev.files, ...fileArray]
      }));
      
      // Auto-tag files
      fileArray.forEach(file => {
        // Simple auto-tagging based on filename
        const tags: string[] = [];
        
        if (file.name.toLowerCase().includes('petition')) {
          tags.push('petition');
        }
        
        if (file.name.toLowerCase().includes('affidavit')) {
          tags.push('affidavit');
        }
        
        if (file.name.toLowerCase().includes('report')) {
          tags.push('report');
        }
        
        // Add character names as tags if they appear in the filename
        wizardData.characters.forEach(char => {
          if (char.name && file.name.toLowerCase().includes(char.name.toLowerCase())) {
            tags.push(char.name.toLowerCase().replace(/\s+/g, '_'));
          }
        });
        
        // If no tags were assigned, use a default tag
        if (tags.length === 0) {
          tags.push('document');
        }
        
        setWizardData(prev => ({
          ...prev,
          fileTags: {
            ...prev.fileTags,
            [file.name]: tags
          }
        }));
      });
    }
  };

  const updateFileTag = (fileName: string, tagIndex: number, newTag: string) => {
    setWizardData(prev => ({
      ...prev,
      fileTags: {
        ...prev.fileTags,
        [fileName]: prev.fileTags[fileName].map((tag, idx) => 
          idx === tagIndex ? newTag : tag
        )
      }
    }));
  };

  const removeFile = (fileName: string) => {
    setWizardData(prev => ({
      ...prev,
      files: prev.files.filter(file => file.name !== fileName),
      fileTags: Object.fromEntries(
        Object.entries(prev.fileTags).filter(([key]) => key !== fileName)
      )
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Name Your Case</h2>
            <div>
              <label htmlFor="caseName" className="block text-sm font-medium text-gray-700 mb-1">
                Case Name
              </label>
              <input
                type="text"
                id="caseName"
                name="caseName"
                value={wizardData.caseName}
                onChange={handleInputChange}
                placeholder="e.g., Weyl Family Law"
                className="input"
                required
              />
            </div>
            {!templateId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Template (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      className={`card cursor-pointer transition-colors ${
                        wizardData.templateId === t.id ? 'border-primary' : ''
                      }`}
                      onClick={() => {
                        setTemplate(t);
                        setWizardData(prev => ({
                          ...prev,
                          templateId: t.id
                        }));
                      }}
                    >
                      <h3 className="text-lg font-medium text-primary">{t.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cast of Characters</h2>
            
            <div className="space-y-4">
              {wizardData.characters.map((char, index) => (
                <div key={char.id} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character Name
                    </label>
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => handleCharacterChange(char.id, 'name', e.target.value)}
                      placeholder="e.g., Rachel Weyl"
                      className="input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={char.role}
                      onChange={(e) => handleCharacterChange(char.id, 'role', e.target.value)}
                      placeholder="e.g., Client, Opposing Party"
                      className="input"
                    />
                  </div>
                  {wizardData.characters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCharacter(char.id)}
                      className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCharacter}
                className="btn btn-secondary"
              >
                + Add Character
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  id="jurisdiction"
                  name="jurisdiction"
                  value={wizardData.jurisdiction}
                  onChange={handleInputChange}
                  placeholder="e.g., Travis County, Texas"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="court" className="block text-sm font-medium text-gray-700 mb-1">
                  Court Details
                </label>
                <input
                  type="text"
                  id="court"
                  name="court"
                  value={wizardData.court}
                  onChange={handleInputChange}
                  placeholder="e.g., Judge Smith, 126th District"
                  className="input"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="opposingCounsel" className="block text-sm font-medium text-gray-700 mb-1">
                Opposing Counsel
              </label>
              <input
                type="text"
                id="opposingCounsel"
                name="opposingCounsel"
                value={wizardData.opposingCounsel}
                onChange={handleInputChange}
                placeholder="e.g., Jane Doe"
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="objectives" className="block text-sm font-medium text-gray-700 mb-1">
                Case Objectives
              </label>
              <textarea
                id="objectives"
                name="objectives"
                value={wizardData.objectives}
                onChange={handleInputChange}
                placeholder="e.g., Secure custody for Rachel, cite §153.002"
                className="input h-24"
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upload Documents</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer block"
              >
                <div className="space-y-2">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-gray-700">
                    <span className="text-primary font-medium">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, Word, or text files
                  </p>
                </div>
              </label>
            </div>
            
            {wizardData.files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Uploaded Files</h3>
                <ul className="space-y-2">
                  {wizardData.files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tag Files</h2>
            
            {Object.keys(wizardData.fileTags).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(wizardData.fileTags).map(([fileName, tags]) => (
                  <div key={fileName} className="card">
                    <h3 className="font-medium mb-2">{fileName}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, tagIndex) => (
                        <div key={tagIndex} className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => updateFileTag(fileName, tagIndex, e.target.value)}
                            className="bg-transparent border-none focus:ring-0 p-0 text-sm w-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No files to tag. You can go back to upload files or continue.</p>
              </div>
            )}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Set Goal</h2>
            
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                What would you like to accomplish with this case?
              </label>
              <textarea
                id="goal"
                name="goal"
                value={wizardData.goal}
                onChange={handleInputChange}
                placeholder="e.g., Draft motion, prepare cross-examination, cite relevant laws"
                className="input h-32"
              />
            </div>
            
            <div className="bg-blue-50 border-l-4 border-primary p-4 text-sm text-blue-700">
              <p>
                <strong>Tip:</strong> Be specific about your goals to get the best results. Include tasks like "draft motion," "prepare cross-examination," or "cite Texas §153.002" to help the AI understand your needs.
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700">Assistant Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Name:</strong> {wizardData.caseName || 'Unnamed Assistant'}
              </p>
              {wizardData.templateId && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Template:</strong> {templates.find(t => t.id === wizardData.templateId)?.name || 'Custom'}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                <strong>Documents:</strong> {wizardData.files.length} files
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {template ? `New Case: ${template.name}` : 'Create New Case'}
        </h1>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex items-center ${stepNumber < 5 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  stepNumber === step
                    ? 'bg-primary text-white'
                    : stepNumber < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber < step ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    stepNumber < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <div>Name</div>
          <div>Characters</div>
          <div>Documents</div>
          <div>Tags</div>
          <div>Goal</div>
        </div>
      </div>
      
      <div className="card mb-6">
        {renderStep()}
      </div>
      
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSkip}
            className="btn btn-secondary"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary flex items-center"
            disabled={step === 1 && !wizardData.caseName}
          >
            {step === 5 ? 'Finish' : 'Next'}
            {step !== 5 && <ArrowRightIcon className="h-4 w-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wizard; 