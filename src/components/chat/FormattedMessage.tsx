import React from 'react';

interface FormattedMessageProps {
  content: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  const formatContent = (text: string) => {
    // Check if content is a marketing plan or similar structured content
    const isMarketingPlan = text.includes('**Marketing Plan') || 
                            text.includes('Campaign Title') || 
                            (text.includes('**') && /\d+\.\s+\*\*/.test(text));
    
    // Check if it's a step-by-step guide
    const isStepByStep = text.includes('Step 1:') || 
                         text.includes('1.') && text.includes('2.') && text.includes('3.') ||
                         text.match(/\d+\.\s+[A-Z]/);
    
    if (isStepByStep) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          {/* Extract title if it exists */}
          {text.match(/^#+ (.*?)$/m)?.[1] && (
            <h3 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-blue-800 to-indigo-600 bg-clip-text text-transparent">
              {text.match(/^#+ (.*?)$/m)?.[1]}
            </h3>
          )}
          
          <div className="space-y-4">
            {/* Process each line, handling numbered steps */}
            {text.split('\n').map((line, lineIndex) => {
              // Handle numbered steps (e.g., "1. Do this" or "Step 1: Do this")
              if (/^\d+\.\s+/.test(line) || /^Step \d+:/.test(line)) {
                const stepNumber = line.match(/^\d+/)?.[0] || line.match(/Step (\d+)/)?.[1];
                let content = line.replace(/^\d+\.\s+/, '').replace(/^Step \d+:\s*/, '');
                
                return (
                  <div key={lineIndex} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold">
                      {stepNumber}
                    </div>
                    <div className="flex-grow">
                      <div className="text-gray-700">{content}</div>
                    </div>
                  </div>
                );
              }
              
              // Handle bullet points
              if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                return (
                  <div key={lineIndex} className="flex items-start gap-3 ml-8">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                    <div className="text-gray-700">
                      {line.replace(/^[-*]\s*/, '')}
                    </div>
                  </div>
                );
              }
              
              // Handle sections like "Tips:" or "Resources:" that aren't numbered
              if ((line.endsWith(':') && line.length < 30) || (line.includes('**') && line.includes(':'))) {
                const sectionTitle = line.replace(/:/g, '').replace(/\*\*/g, '').trim();
                
                return (
                  <div key={lineIndex} className="mt-4 border-t border-blue-100 pt-3">
                    <div className="font-medium text-blue-800">{sectionTitle}:</div>
                  </div>
                );
              }
              
              // Regular text
              if (line.trim()) {
                return (
                  <div key={lineIndex} className="text-gray-700">
                    {line}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      );
    }
    
    if (isMarketingPlan) {
      // ... keep existing code for marketing plan formatting
      return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          {text.match(/\*\*(.*?)\*\*/)?.[1] && (
            <h3 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              {text.match(/\*\*(.*?)\*\*/)?.[1]}
            </h3>
          )}
          
          <div className="space-y-3">
            {text.split('\n').map((line, lineIndex) => {
              if (/^\d+\.\s+\*\*/.test(line)) {
                const [number, rest] = line.split(/\.\s+\*\*/, 2);
                const title = rest.split('**:')[0] || rest.split('**')[0];
                const content = line.includes(':') ? line.split(':')[1]?.trim() : '';
                
                return (
                  <div key={lineIndex} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-semibold">
                      {number}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-purple-800">{title}</div>
                      {content && <div className="text-gray-700 mt-1">{content}</div>}
                    </div>
                  </div>
                );
              }
              
              if (line.trim().startsWith('-')) {
                return (
                  <div key={lineIndex} className="flex items-start gap-3 ml-8">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                    <div className="text-gray-700">
                      {line.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                    </div>
                  </div>
                );
              }
              
              if (line.includes('**') && line.includes(':')) {
                const sectionTitle = line.split('**:')[0].replace('**', '') || line.split('**')[0].replace('**', '');
                const sectionContent = line.includes(':') ? line.split(':')[1]?.trim() : '';
                
                return (
                  <div key={lineIndex} className="mt-4 border-t border-purple-100 pt-3">
                    <div className="font-medium text-purple-800">{sectionTitle}:</div>
                    {sectionContent && <div className="text-gray-700 mt-1">{sectionContent}</div>}
                  </div>
                );
              }
              
              if (line.trim() && !line.trim().startsWith('**')) {
                return (
                  <div key={lineIndex} className="text-gray-700">
                    {line.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      );
    }
    
    // Default formatting for other content types
    // ... keep existing code for default formatting
    const sections = text.split(/(?=###)/);
    
    return sections.map((section, index) => {
      if (section.startsWith('###')) {
        const [header, ...content] = section.split('\n');
        const headerText = header.replace('###', '').trim();
        
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              {headerText}
            </h3>
            <div className="pl-4 border-l-2 border-purple-200">
              {content.join('\n').split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('-')) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5">•</span>
                      <div className="text-gray-700">
                        {line.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                      </div>
                    </div>
                  );
                }
                if (/^\d+\./.test(line.trim())) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-3">
                      <span className="text-purple-800 mt-1.5 min-w-[1.5rem]">{line.match(/^\d+/)?.[0]}.</span>
                      <div className="text-gray-700">
                        {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={lineIndex} className="mb-3 text-gray-700">
                    {line.replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      const lines = section.split('\n');
      return (
        <div key={index} className="mb-3">
          {lines.map((line, lineIndex) => {
            if (line.trim().startsWith('-')) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 mb-3">
                  <span className="text-purple-800 mt-1.5">•</span>
                  <div className="text-gray-700">
                    {line.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                </div>
              );
            }
            if (/^\d+\./.test(line.trim())) {
              return (
                <div key={lineIndex} className="flex items-start gap-2 mb-3">
                  <span className="text-purple-800 mt-1.5 min-w-[1.5rem]">{line.match(/^\d+/)?.[0]}.</span>
                  <div className="text-gray-700">
                    {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '')}
                  </div>
                </div>
              );
            }
            return (
              <div key={lineIndex} className="mb-3 text-gray-700">
                {line.replace(/\*\*/g, '').replace(/\*/g, '')}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;
