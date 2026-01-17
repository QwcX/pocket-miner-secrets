import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerify: (verified: boolean) => void;
}

const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-', '×'];
  const opIndex = Math.floor(Math.random() * 3);
  const operator = operators[opIndex];
  
  let answer: number;
  switch (operator) {
    case '+':
      answer = num1 + num2;
      break;
    case '-':
      answer = num1 - num2;
      break;
    case '×':
      answer = num1 * num2;
      break;
    default:
      answer = num1 + num2;
  }
  
  return {
    question: `${num1} ${operator} ${num2} = ?`,
    answer: answer.toString(),
  };
};

export function SimpleCaptcha({ onVerify }: SimpleCaptchaProps) {
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const isCorrect = userAnswer.trim() === captcha.answer;
    onVerify(isCorrect);
    setError(userAnswer.length > 0 && !isCorrect);
  }, [userAnswer, captcha.answer, onVerify]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setUserAnswer('');
    onVerify(false);
  };

  return (
    <div className="space-y-2">
      <Label>Проверка: решите пример</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-lg font-mono bg-secondary px-3 py-2 rounded-md select-none">
            {captcha.question}
          </span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9-]*"
            placeholder="Ответ"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className={`w-24 ${error ? 'border-destructive' : userAnswer && !error ? 'border-green-500' : ''}`}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={refreshCaptcha}
          title="Новый пример"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive">Неверный ответ</p>
      )}
    </div>
  );
}
