import { AgendaItem, TopicTag } from '@/lib/types';

/** Test-only agenda items. The app itself loads real agendas from CivicClerk. */
/** nth weekday of a month. weekday: 0=Sun … 3=Wed. n is 1-based. */
export function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, n: number): Date {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset + (n - 1) * 7);
}

/** Next 2nd Wednesday on or after `from` (local dates). */
export function nextSecondWednesday(from: Date = new Date()): Date {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let year = start.getFullYear();
  let month = start.getMonth();
  for (let i = 0; i < 14; i += 1) {
    const candidate = nthWeekdayOfMonth(year, month, 3, 2);
    if (candidate >= start) return candidate;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return nthWeekdayOfMonth(year, month, 3, 2);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function getDemoAgendaItems(from: Date = new Date()): AgendaItem[] {
  const youthDate = nextSecondWednesday(from);
  const bptDate = addDays(youthDate, 7);
  const parksDate = addDays(youthDate, 14);
  const councilDate = addDays(youthDate, 21);
  const youthDate2 = nextSecondWednesday(addDays(youthDate, 1));

  return [
    {
      id: 'demo-youth-gov-day-2027',
      summary_i18n: {"zh": "委员们将讨论 2027 年“青年参政日”的筹备工作。这是演示数据，不是真实议程。", "hi": "आयुक्त 2027 के यूथ इन गवर्नमेंट डे की योजना पर बात करेंगे। यह डेमो डेटा है, असली एजेंडा नहीं।", "pa": "ਕਮਿਸ਼ਨਰ 2027 ਦੇ ਯੂਥ ਇਨ ਗਵਰਨਮੈਂਟ ਡੇ ਦੀ ਯੋਜਨਾ ਬਾਰੇ ਗੱਲ ਕਰਨਗੇ। ਇਹ ਡੈਮੋ ਡਾਟਾ ਹੈ, ਅਸਲ ਏਜੰਡਾ ਨਹੀਂ।", "ko": "위원들이 2027년 청소년 정부 체험의 날 준비를 논의합니다. 실제 안건이 아닌 데모 데이터입니다.", "te": "కమిషనర్లు 2027 యూత్ ఇన్ గవర్నమెంట్ డే ప్రణాళిక గురించి చర్చిస్తారు. ఇది డెమో డేటా, అసలు ఎజెండా కాదు.", "vi": "Các ủy viên sẽ thảo luận việc chuẩn bị Ngày Thanh niên trong Chính quyền 2027. Đây là dữ liệu mẫu, không phải chương trình nghị sự thật.", "tl": "Pag-uusapan ng mga komisyoner ang paghahanda para sa Youth in Government Day 2027. Demo data ito, hindi totoong agenda."},
      body_id: 'pleasanton_youth_commission',
      meeting_date: isoDate(youthDate),
      meeting_time: '7:00 PM',
      item_number: '4',
      title: 'Review and discuss Youth in Government Day 2027',
      summary_en:
        'Commissioners will talk about planning Youth in Government Day 2027. This is demo data, not a live agenda.',
      summary_es:
        'Las y los comisionados hablarán sobre la planificación del Youth in Government Day 2027. Esto es datos de demostración, no una agenda real.',
      topics: ['youth_events', 'youth_programs'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
    {
      id: 'demo-bpt-crossings',
      summary_i18n: {"zh": "一项演示讨论：哪些路口和步道连接可能需要关注。并非来自真实议程。", "hi": "एक डेमो चर्चा कि किन क्रॉसिंग और ट्रेल कनेक्शनों पर ध्यान देने की ज़रूरत हो सकती है। असली एजेंडा से नहीं।", "pa": "ਇੱਕ ਡੈਮੋ ਚਰਚਾ ਕਿ ਕਿਹੜੇ ਕ੍ਰਾਸਿੰਗ ਅਤੇ ਟ੍ਰੇਲ ਕਨੈਕਸ਼ਨਾਂ ਵੱਲ ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੋ ਸਕਦੀ ਹੈ। ਅਸਲ ਏਜੰਡੇ ਤੋਂ ਨਹੀਂ।", "ko": "어느 횡단보도와 산책로 연결에 관심이 필요한지에 대한 데모 논의입니다. 실제 안건이 아닙니다.", "te": "ఏ క్రాసింగ్‌లు మరియు ట్రయల్ కనెక్షన్‌లపై దృష్టి అవసరమో అనే డెమో చర్చ. అసలు ఎజెండా నుండి కాదు.", "vi": "Một thảo luận mẫu về những chỗ qua đường và kết nối đường mòn cần được quan tâm. Không lấy từ chương trình nghị sự thật.", "tl": "Isang demo na talakayan kung aling mga tawiran at koneksyon ng trail ang kailangang tingnan. Hindi galing sa totoong agenda."},
      body_id: 'pleasanton_bpt_committee',
      meeting_date: isoDate(bptDate),
      meeting_time: null,
      item_number: '4',
      title: 'Review pedestrian crossing and trail connection priorities',
      summary_en:
        'A demo discussion of where crossings and trail links may need attention. Not taken from a live agenda.',
      summary_es:
        'Una discusión de demostración sobre cruces peatonales y conexiones de senderos. No proviene de una agenda real.',
      topics: ['pedestrian_safety', 'bike_infrastructure', 'trails'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
    {
      id: 'demo-parks-facilities',
      summary_i18n: {"zh": "一项关于公园设施预约和使用方式的演示事项。并非来自真实议程。", "hi": "पार्क सुविधाओं की बुकिंग और उपयोग के बारे में एक डेमो विषय। असली एजेंडा से नहीं।", "pa": "ਪਾਰਕ ਸਹੂਲਤਾਂ ਦੀ ਬੁਕਿੰਗ ਅਤੇ ਵਰਤੋਂ ਬਾਰੇ ਇੱਕ ਡੈਮੋ ਵਿਸ਼ਾ। ਅਸਲ ਏਜੰਡੇ ਤੋਂ ਨਹੀਂ।", "ko": "공원 시설 예약과 이용 방식에 관한 데모 안건입니다. 실제 안건이 아닙니다.", "te": "పార్క్ సౌకర్యాల బుకింగ్ మరియు వినియోగం గురించి డెమో అంశం. అసలు ఎజెండా నుండి కాదు.", "vi": "Một mục mẫu về cách đặt và sử dụng cơ sở trong công viên. Không lấy từ chương trình nghị sự thật.", "tl": "Isang demo na item tungkol sa pagreserba at paggamit ng mga pasilidad sa parke. Hindi galing sa totoong agenda."},
      body_id: 'pleasanton_parks_rec',
      meeting_date: isoDate(parksDate),
      meeting_time: null,
      item_number: '3',
      title: 'Review park facility use guidelines',
      summary_en:
        'A demo item about how park facilities are reserved and used. Not taken from a live agenda.',
      summary_es:
        'Un tema de demostración sobre el uso de instalaciones de parques. No proviene de una agenda real.',
      topics: ['parks', 'recreation_facilities'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
    {
      id: 'demo-library-hours',
      summary_i18n: {"zh": "一项关于图书馆开放时间和学生学习空间的演示事项。并非来自真实议程。", "hi": "पुस्तकालय के समय और छात्रों के पढ़ने की जगह पर एक डेमो विषय। असली एजेंडा से नहीं।", "pa": "ਲਾਇਬ੍ਰੇਰੀ ਦੇ ਸਮੇਂ ਅਤੇ ਵਿਦਿਆਰਥੀਆਂ ਦੇ ਪੜ੍ਹਨ ਦੀ ਥਾਂ ਬਾਰੇ ਇੱਕ ਡੈਮੋ ਵਿਸ਼ਾ। ਅਸਲ ਏਜੰਡੇ ਤੋਂ ਨਹੀਂ।", "ko": "도서관 운영 시간과 학생 학습 공간에 관한 데모 안건입니다. 실제 안건이 아닙니다.", "te": "గ్రంథాలయ సమయాలు మరియు విద్యార్థుల చదువు స్థలం గురించి డెమో అంశం. అసలు ఎజెండా నుండి కాదు.", "vi": "Một mục mẫu về giờ mở cửa thư viện và chỗ học cho học sinh. Không lấy từ chương trình nghị sự thật.", "tl": "Isang demo na item tungkol sa oras ng aklatan at lugar-aralan ng mga estudyante. Hindi galing sa totoong agenda."},
      body_id: 'pleasanton_library_commission',
      meeting_date: isoDate(addDays(youthDate, 1)),
      meeting_time: null,
      item_number: '5',
      title: 'Review library hours and student study space',
      summary_en:
        'A demo item about library hours and space for students to study. Not taken from a live agenda.',
      summary_es:
        'Un tema de demostración sobre el horario de la biblioteca y espacios de estudio para estudiantes. No proviene de una agenda real.',
      topics: ['library'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
    {
      id: 'demo-council-housing',
      summary_i18n: {"zh": "一场关于住房政策的演示研讨会。并非来自真实议程。", "hi": "आवास नीति पर एक डेमो अध्ययन सत्र। असली एजेंडा से नहीं।", "pa": "ਰਿਹਾਇਸ਼ ਨੀਤੀ ਬਾਰੇ ਇੱਕ ਡੈਮੋ ਅਧਿਐਨ ਸੈਸ਼ਨ। ਅਸਲ ਏਜੰਡੇ ਤੋਂ ਨਹੀਂ।", "ko": "주거 정책에 관한 데모 연구 세션입니다. 실제 안건이 아닙니다.", "te": "గృహ విధానంపై డెమో అధ్యయన సమావేశం. అసలు ఎజెండా నుండి కాదు.", "vi": "Một buổi nghiên cứu mẫu về chính sách nhà ở. Không lấy từ chương trình nghị sự thật.", "tl": "Isang demo na study session tungkol sa patakaran sa pabahay. Hindi galing sa totoong agenda."},
      body_id: 'pleasanton_city_council',
      meeting_date: isoDate(councilDate),
      meeting_time: null,
      item_number: '8',
      title: 'Study session on housing element implementation',
      summary_en:
        'A demo study session label about housing policy. Not taken from a live agenda.',
      summary_es:
        'Una sesión de estudio de demostración sobre vivienda. No proviene de una agenda real.',
      topics: ['housing'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
    {
      id: 'demo-youth-teen-spaces',
      summary_i18n: {"zh": "一场关于青少年活动场所和开放时间的演示讨论。并非来自真实议程。", "hi": "किशोरों के लिए जगहों और समय के बारे में एक डेमो बातचीत। असली एजेंडा से नहीं।", "pa": "ਕਿਸ਼ੋਰਾਂ ਲਈ ਥਾਵਾਂ ਅਤੇ ਸਮੇਂ ਬਾਰੇ ਇੱਕ ਡੈਮੋ ਗੱਲਬਾਤ। ਅਸਲ ਏਜੰਡੇ ਤੋਂ ਨਹੀਂ।", "ko": "청소년을 위한 공간과 운영 시간에 관한 데모 논의입니다. 실제 안건이 아닙니다.", "te": "టీనేజర్ల కోసం స్థలాలు మరియు సమయాల గురించి డెమో చర్చ. అసలు ఎజెండా నుండి కాదు.", "vi": "Một cuộc trao đổi mẫu về địa điểm và giờ mở cửa cho thanh thiếu niên. Không lấy từ chương trình nghị sự thật.", "tl": "Isang demo na usapan tungkol sa mga lugar at oras para sa mga teen. Hindi galing sa totoong agenda."},
      body_id: 'pleasanton_youth_commission',
      meeting_date: isoDate(youthDate2),
      meeting_time: '7:00 PM',
      item_number: '5',
      title: 'Discuss teen gathering spaces and evening programs',
      summary_en:
        'A demo conversation about places and hours for teens. Not taken from a live agenda.',
      summary_es:
        'Una conversación de demostración sobre espacios y horarios para jóvenes. No proviene de una agenda real.',
      topics: ['youth_spaces', 'teen_services'] as TopicTag[],
      source_url: null,
      is_demo: true,
    },
  ];
}

export const AGENDA_ITEMS: AgendaItem[] = getDemoAgendaItems();
