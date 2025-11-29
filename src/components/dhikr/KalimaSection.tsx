import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { DuaCard } from "./DuaCard";

export const KalimaSection = () => {
  const kalimas = [
    {
      id: "kalima-1",
      arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ مُحَمَّدٌ رَسُولُ ٱللَّٰهِ",
      transcription: "La ilaha illallah, Muhammadur rasulullah",
      russianTranscription: "Ля иляха илляллах, Мухаммадур расулюллах",
      translation: "Нет божества, кроме Аллаха, Мухаммад — Посланник Аллаха",
      reference: "Калима Шахада (Свидетельство веры)",
      audioUrl: null,
    },
    {
      id: "kalima-2",
      arabic: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
      transcription: "Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh",
      russianTranscription: "Ашхаду ан ля иляха илляллаху вахдаху ля шарика лях, ва ашхаду анна Мухаммадан 'абдуху ва расулух",
      translation: "Свидетельствую, что нет божества, кроме одного Аллаха, у Которого нет сотоварища, и свидетельствую, что Мухаммад — Его раб и посланник",
      reference: "Калима Шахадат (Свидетельство)",
      audioUrl: null,
    },
    {
      id: "kalima-3",
      arabic: "سُبْحَانَ ٱللَّٰهِ وَٱلْحَمْدُ لِلَّٰهِ وَلَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَٱللَّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ",
      transcription: "Subhanallahi walhamdulillahi wa la ilaha illallahu wallahu akbar. Wa la hawla wa la quwwata illa billahil 'aliyyil 'azim",
      russianTranscription: "Субханаллахи валь-хамду лиллахи ва ля иляха илляллаху валлаху акбар. Ва ля хауля ва ля куввата илля биллахиль-'алиййиль-'азим",
      translation: "Свят Аллах, хвала Аллаху, нет божества, кроме Аллаха, и Аллах Велик. Нет силы и мощи ни у кого, кроме Всевышнего, Великого Аллаха",
      reference: "Калима Тамджид (Возвеличивание)",
      audioUrl: null,
    },
    {
      id: "kalima-4",
      arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ أَبَدًا أَبَدًا ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ بِيَدِهِ ٱلْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      transcription: "La ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamd, yuhyi wa yumit, wa huwa hayyun la yamut, abadan abada, dhul jalali wal ikram, biyadihil khayr, wa huwa 'ala kulli shay'in qadir",
      russianTranscription: "Ля иляха илляллаху вахдаху ля шарика лях, ляхуль-мульку ва ляхуль-хамд, юхйи ва юмит, ва хува хаййун ля ямут, абадан абада, зуль-джаляли валь-икрам, биядихиль-хайр, ва хува 'аля кулли шай'ин кадир",
      translation: "Нет божества, кроме одного Аллаха, у Которого нет сотоварища. Ему принадлежит власть, Ему хвала. Он оживляет и умерщвляет, и Он — Живой, Который не умирает никогда. В Его руке благо, и Он над всякой вещью Всемогущий",
      reference: "Калима Тавхид (Единобожие)",
      audioUrl: null,
    },
    {
      id: "kalima-5",
      arabic: "أَسْتَغْفِرُ ٱللَّٰهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَأَتُوبُ إِلَيْهِ مِنَ ٱلذَّنْبِ ٱلَّذِي أَعْلَمُ وَمِنَ ٱلذَّنْبِ ٱلَّذِي لَا أَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ ٱلْغُيُوبِ وَسَتَّارُ ٱلْعُيُوبِ وَغَفَّارُ ٱلذُّنُوبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ ٱلْعَلِيِّ ٱلْعَظِيمِ",
      transcription: "Astaghfirullaha Rabbi min kulli dhanbin adhnabtuhu 'amdan aw khata'an, sirran aw 'alaniyatan, wa atubu ilayhi minath-dhanbil-ladhi a'lamu wa minath-dhanbil-ladhi la a'lam. Innaka anta 'allamul ghuyub wa sattarul 'uyub wa ghaffarudh-dhunub. Wa la hawla wa la quwwata illa billahil 'aliyyil 'azim",
      russianTranscription: "Астагфируллаха Рабби мин кулли занбин азнабтуху 'амдан ав хата'ан, сирран ав 'аляниятан, ва атубу иляйхи миназ-занбил-лязи а'ляму ва миназ-занбил-лязи ля а'лям. Иннака анта 'аллямуль-гуюб ва саттаруль-'уюб ва гaffаруз-зунуб. Ва ля хауля ва ля куввата илля биллахиль-'алиййиль-'азим",
      translation: "Прошу прощения у Аллаха, моего Господа, за каждый грех, который я совершил намеренно или по ошибке, тайно или открыто. И я каюсь перед Ним в грехах, о которых я знаю, и в грехах, о которых не знаю. Поистине, Ты — Знающий сокровенное, Скрывающий недостатки и Прощающий грехи. Нет силы и мощи ни у кого, кроме Всевышнего, Великого Аллаха",
      reference: "Калима Истигфар (Покаяние)",
      audioUrl: null,
    },
    {
      id: "kalima-6",
      arabic: "آمَنْتُ بِٱللَّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَٱلْيَوْمِ ٱلْآخِرِ وَبِٱلْقَدَرِ خَيْرِهِ وَشَرِّهِ مِنَ ٱللَّٰهِ تَعَالَىٰ وَٱلْبَعْثِ بَعْدَ ٱلْمَوْتِ",
      transcription: "Amantu billahi wa mala'ikatihi wa kutubihi wa rusulihi wal yawmil akhir, wal qadari khayrihi wa sharrihi minallahi ta'ala wal ba'thi ba'dal mawt",
      russianTranscription: "Аманту биллахи ва маля'икатихи ва кутубихи ва русулихи валь-явмиль-ахир, валь-кадари хайрихи ва шаррихи миналлахи та'аля валь-ба'си ба'даль-мавт",
      translation: "Я уверовал в Аллаха, в Его ангелов, в Его Писания, в Его посланников, в Судный день, в предопределение — его хорошее и плохое от Аллаха Всевышнего, и в воскрешение после смерти",
      reference: "Калима Иман (Вера)",
      audioUrl: null,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Card className="glass shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">Шесть Калим</CardTitle>
              <CardDescription>
                Основополагающие формулы исламской веры
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {kalimas.map((kalima, index) => (
          <div key={kalima.id} className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-glow-gold">
                <span className="text-sm font-bold text-accent-foreground">{index + 1}</span>
              </div>
              <h3 className="font-semibold text-foreground">{kalima.reference}</h3>
            </div>
            <DuaCard dua={kalima} categoryColor="primary" />
          </div>
        ))}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="gradient-text">Важно:</strong> Шесть Калим являются основными формулами исламской веры.
            Рекомендуется регулярно читать их для укрепления имана и поминания Аллаха.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
