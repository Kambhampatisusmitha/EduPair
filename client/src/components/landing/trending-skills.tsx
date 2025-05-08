import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface TrendingSkill {
  id: number;
  name: string;
  categories: string[];
  teachingCount: number;
  learningCount: number;
}

export default function TrendingSkills() {
  const { openSignupModal } = useAuth();
  
  const trendingSkills: TrendingSkill[] = [
    {
      id: 1,
      name: "JavaScript Development",
      categories: ["Web development", "React", "Node.js"],
      teachingCount: 1400,
      learningCount: 2800
    },
    {
      id: 2,
      name: "Digital Photography",
      categories: ["DSLR", "Editing", "Composition"],
      teachingCount: 890,
      learningCount: 1900
    },
    {
      id: 3,
      name: "Spanish Language",
      categories: ["Conversation", "Grammar", "Culture"],
      teachingCount: 1200,
      learningCount: 3200
    }
  ];

  return (
    <div className="py-16 bg-background dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-heading font-bold text-primary dark:text-white">Trending Skills</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover what people are teaching and learning on EduPair right now.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {trendingSkills.map((skill) => (
            <div key={skill.id} className="bg-white dark:bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-heading font-semibold text-primary dark:text-white">
                    {skill.name}
                  </h3>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm skill-teach">
                      {skill.teachingCount.toLocaleString()} Teaching
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-start">
                  <p className="text-gray-600 dark:text-gray-300">
                    {skill.categories.join(", ")}
                  </p>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm skill-learn">
                      {skill.learningCount.toLocaleString()} Learning
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            onClick={openSignupModal}
            className="bg-secondary hover:bg-secondary-dark dark:bg-light-blue dark:hover:bg-light-blue-dark text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition"
          >
            Explore All Skills
          </Button>
        </div>
      </div>
    </div>
  );
}
