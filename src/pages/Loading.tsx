import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Loading = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const stages = [
      { delay: 0, emoji: "🐒" },
      { delay: 800, emoji: "🚶‍♂️" },
      { delay: 1600, emoji: "🧑‍💻" },
    ];

    stages.forEach(({ delay, emoji }, index) => {
      setTimeout(() => setStage(index), delay);
    });

    setTimeout(() => navigate("/auth"), 2800);
  }, [navigate]);

  const emojis = ["🐒", "🚶‍♂️", "🧑‍💻"];
  const labels = ["Beginner", "Learning", "Developer"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8 text-8xl transition-all duration-500 animate-in fade-in zoom-in">
          {emojis[stage]}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground transition-all duration-300">
            {labels[stage]}
          </h2>
          <p className="text-muted-foreground">Evolution in Progress...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
