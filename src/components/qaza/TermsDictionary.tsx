// Компонент словарика терминов

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { eReplikaAPI } from "@/lib/api";
import type { Term } from "@/types/prayer-debt";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TermsDictionary = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoading(true);
        const loadedTerms = await eReplikaAPI.getTerms();
        setTerms(loadedTerms);
      } catch (error) {
        console.error("Failed to load terms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, []);

  const filteredTerms = terms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (term.transliteration?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <Card className="bg-gradient-card shadow-medium border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle>Словарик терминов</CardTitle>
        </div>
        <CardDescription>
          Краткое объяснение исламских терминов, используемых в калькуляторе
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск терминов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Terms List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка терминов...</div>
        ) : filteredTerms.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchQuery ? "Термины не найдены" : "Термины не загружены"}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTerms.map((term, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {term.term}
                      {term.transliteration && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({term.transliteration})
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">{term.definition}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

