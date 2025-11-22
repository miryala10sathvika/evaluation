import React from 'react';
import { Candidate, UserEvaluation, RatingEnum, LLMCriteria } from '../types';
import { CheckCircle, XCircle, AlertCircle, BookOpen } from 'lucide-react';

interface EvaluationFormProps {
  candidate: Candidate;
  evaluation: UserEvaluation;
  onChange: (updatedEval: UserEvaluation) => void;
}

const RatingCheckbox: React.FC<{
  label: string;
  selected: RatingEnum | null;
  onSelect: (val: RatingEnum) => void;
}> = ({ label, selected, onSelect }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="space-y-2">
      {Object.values(RatingEnum).map((rating) => (
        <label 
          key={rating} 
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
            selected === rating 
              ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <input
            type="radio"
            name={label}
            checked={selected === rating}
            onChange={() => onSelect(rating)}
            className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
          />
          <span className="ml-3 text-sm text-slate-700">{rating}</span>
        </label>
      ))}
    </div>
  </div>
);

const AgreeToggle: React.FC<{
  label: string;
  llmCriteria?: LLMCriteria;
  checked: boolean | null;
  onChange: (val: boolean) => void;
}> = ({ label, llmCriteria, checked, onChange }) => (
  <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{label}</h4>
      {checked !== null && (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${checked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {checked ? 'AGREED' : 'DISAGREED'}
        </span>
      )}
    </div>
    
    {llmCriteria ? (
      <div className="bg-slate-50 p-3 rounded-md mb-4 border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">LLM SAYS</span>
           <span className="text-xs font-semibold text-indigo-700">{llmCriteria.rating}</span>
        </div>
        <p className="text-sm text-slate-700 italic leading-relaxed">"{llmCriteria.justification}"</p>
      </div>
    ) : (
      <div className="bg-amber-50 p-3 rounded-md mb-4 border border-amber-100 flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-500" />
        <span className="text-xs text-amber-700">No LLM Judgment available for this candidate.</span>
      </div>
    )}

    <div className="flex gap-3">
      <button
        onClick={() => onChange(true)}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
          checked === true 
            ? 'bg-green-600 text-white shadow-md' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <CheckCircle size={16} />
        Agree
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
          checked === false 
            ? 'bg-red-600 text-white shadow-md' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <XCircle size={16} />
        Disagree
      </button>
    </div>
  </div>
);

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ candidate, evaluation, onChange }) => {
  
  const update = (key: keyof UserEvaluation, value: any) => {
    onChange({ ...evaluation, [key]: value });
  };

  // Common classes for textareas to ensure visibility
  const textareaClasses = "w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm";

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-lg mx-auto pb-10">
        
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600"/>
            Evaluation Form
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Compare the candidate with the ground truth and validate the LLM's assessment.
          </p>
        </div>

        {/* Section 1: Clarity */}
        <AgreeToggle 
          label="1. Clarity" 
          llmCriteria={candidate.llmJudgement?.Clarity}
          checked={evaluation.clarityAgree}
          onChange={(val) => update('clarityAgree', val)}
        />
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Clarity Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={evaluation.clarityJustification || ''}
            onChange={(e) => update('clarityJustification', e.target.value)}
            placeholder="Why do you agree/disagree regarding clarity?"
            className={textareaClasses}
            rows={3}
          />
        </div>

        {/* Section 2: Completeness */}
        <AgreeToggle 
          label="2. Completeness" 
          llmCriteria={candidate.llmJudgement?.Completeness}
          checked={evaluation.completenessAgree}
          onChange={(val) => update('completenessAgree', val)}
        />
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Completeness Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={evaluation.completenessJustification || ''}
            onChange={(e) => update('completenessJustification', e.target.value)}
            placeholder="Why do you agree/disagree regarding completeness?"
            className={textareaClasses}
            rows={3}
          />
        </div>

        {/* Section 3: Consistency */}
        <AgreeToggle 
          label="3. Consistency" 
          llmCriteria={candidate.llmJudgement?.Consistency}
          checked={evaluation.consistencyAgree}
          onChange={(val) => update('consistencyAgree', val)}
        />
         <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Consistency Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={evaluation.consistencyJustification || ''}
            onChange={(e) => update('consistencyJustification', e.target.value)}
            placeholder="Why do you agree/disagree regarding consistency?"
            className={textareaClasses}
            rows={3}
          />
        </div>

        <hr className="my-8 border-slate-200" />

        {/* Section 4: Accuracy */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">4. Accuracy</h4>
          <RatingCheckbox 
            label="How accurate is the image?" 
            selected={evaluation.accuracyRating}
            onSelect={(val) => update('accuracyRating', val)}
          />
          <textarea
            value={evaluation.accuracyJustification || ''}
            onChange={(e) => update('accuracyJustification', e.target.value)}
            placeholder="Justification for accuracy rating..."
            className={`${textareaClasses} mt-3`}
            rows={3}
          />
        </div>

        {/* Section 5: Level of Detail */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">5. Level of Detail</h4>
          <RatingCheckbox 
            label="Does the detail level meet expectations?" 
            selected={evaluation.detailRating}
            onSelect={(val) => update('detailRating', val)}
          />
          <textarea
            value={evaluation.detailJustification || ''}
            onChange={(e) => update('detailJustification', e.target.value)}
            placeholder="Justification for level of detail..."
            className={`${textareaClasses} mt-3`}
            rows={3}
          />
        </div>

      </div>
    </div>
  );
};