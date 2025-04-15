'use client';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {getSensorData} from '@/services/sensor';
import {Icons} from '@/components/icons';
import {useEffect, useState, useRef} from 'react';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {getFanSpeed, setFanSpeed} from '@/services/fan';
import {getLightStatus, setLightStatus} from '@/services/lights';
import {analyzeSensorData} from '@/ai/flows/analyze-sensor-data';
import {Badge} from '@/components/ui/badge';
import {Toaster} from '@/components/ui/toaster';
import {useToast} from '@/hooks/use-toast';
import {
  Chart,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {analyzeLightData} from '@/ai/flows/analyze-light-data';
import {Button} from "@/components/ui/button";
import {Sun, Moon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {aiAssistant} from "@/ai/flows/ai-assistant";

const chartConfig = {
  temperature: {
    label: "دما (°C)",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "رطوبت (%)",
    color: "hsl(var(--chart-2))",
  },
  oxygen: {
    label: "اکسیژن (%)",
    color: "hsl(var(--chart-3))",
  },
};

function Sensors({temperature, humidity, oxygen, lux}: { temperature: number, humidity: number, oxygen: number, lux: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>🌡️ دما</CardTitle>
          <CardDescription>دمای کنونی بر حسب سانتیگراد</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.thermometer className="h-4 w-4"/>
            {temperature}°C
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>💧 رطوبت</CardTitle>
          <CardDescription>درصد رطوبت کنونی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.wind className="h-4 w-4"/>
            {humidity}%
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>💨 اکسیژن</CardTitle>
          <CardDescription>سطح اکسیژن کنونی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.wind className="h-4 w-4"/>
            {oxygen}%
          </div>
        </CardContent>
      </Card>
        <Card>
          <CardHeader>
            <CardTitle>💡 شدت نور</CardTitle>
            <CardDescription>شدت نور کنونی بر حسب لوکس</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Icons.lightbulb className="h-4 w-4"/>
              {lux} Lux
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

const AnimatedBarChart = ({value, label, color}: { value: number, label: string, color: string }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const minHeat = 15;
  const maxHeat = 37.8;

    // Normalize the temperature to a 0-100 scale based on minHeat and maxHeat
    const normalizedValue = Math.max(0, Math.min(100, ((value - minHeat) / (maxHeat - minHeat)) * 100));

  useEffect(() => {
    if (barRef.current) {
      setWidth(normalizedValue);
    }
  }, [normalizedValue]);

  const getUnit = () => {
    if (label.includes("دما")) return "°C";
    return "%";
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(value)}{getUnit()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          ref={barRef}
          className="bg-primary h-2.5 rounded-full"
          style={{width: `${width}%`, backgroundColor: color, transition: 'width 0.5s ease-in-out'}}
        ></div>
      </div>
    </div>
  );
};

const AIInteraction = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAnswer(null);

    try {
      const aiResponse = await aiAssistant({ question });
      setAnswer(aiResponse.answer);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAnswer('Failed to get response from AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 دستیار هوش مصنوعی</CardTitle>
        <CardDescription>سوالات خود را بپرسید و از بینش های مبتنی بر هوش مصنوعی بهره مند شوید.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          placeholder="هر سوالی درباره داده های مزرعه خود دارید بپرسید..."
          value={question}
          onChange={handleQuestionChange}
          className="resize-none"
        />
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'در حال بارگذاری...' : 'دریافت پاسخ'}
        </Button>
        {answer && (
          <div className="rounded-md border p-4">
            <p>{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [oxygen, setOxygen] = useState<number>(0);
    const [lux, setLux] = useState<number>(0);
  const [fanSpeed, setFanSpeedState] = useState<number>(0);
  const [lightStatus, setLightStatusState] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ recommendedFanSpeed: number; explanation: string; } | null>(null);
    const [lightRecommendation, setLightRecommendation] = useState<{ recommendedLightStatus: boolean; explanation: string; } | null>(null);


  const {toast} = useToast();
  const [historicalData, setHistoricalData] = useState([
    {time: '00:00', temperature: 22, humidity: 60, oxygen: 95},
    {time: '03:00', temperature: 23, humidity: 62, oxygen: 94},
    {time: '06:00', temperature: 24, humidity: 64, oxygen: 93},
    {time: '09:00', temperature: 23, humidity: 63, oxygen: 94},
    {time: '12:00', temperature: 25, humidity: 65, oxygen: 92},
    {time: '15:00', temperature: 26, humidity: 66, oxygen: 91},
    {time: '18:00', temperature: 24, humidity: 64, oxygen: 93},
    {time: '21:00', temperature: 23, humidity: 63, oxygen: 94},
    {time: '24:00', temperature: 22, humidity: 61, oxygen: 95},
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [cameraFeeds, setCameraFeeds] = useState([
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
    'https://picsum.photos/640/480',
  ]);
  const [useCamera, setUseCamera] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!useCamera) {
        setHasCameraPermission(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'دسترسی به دوربین رد شد',
          description: 'لطفاً دسترسی دوربین را در تنظیمات مرورگر خود فعال کنید تا از این برنامه استفاده کنید.',
        });
      }
    };

    getCameraPermission();
  }, [useCamera, toast]);


  useEffect(() => {
    const fetchData = async () => {
      const sensorData = await getSensorData();
      setTemperature(sensorData.temperatureCelsius);
      setHumidity(sensorData.humidity);
      setOxygen(sensorData.oxygen);
        setLux(sensorData.lux || 0);

      const fanSettings = await getFanSpeed();
      setFanSpeedState(fanSettings.speed);

      const lightSettings = await getLightStatus();
      setLightStatusState(lightSettings.isOn);

      const aiOutput = await analyzeSensorData({});
      setAiRecommendation(aiOutput);

        const lightOutput = await analyzeLightData({ lux: sensorData.lux || 0 });
        setLightRecommendation(lightOutput);
    };

    fetchData();
  }, []);

  const handleFanSpeedChange = async (value: number[]) => {
    const newSpeed = value[0];
    setFanSpeedState(newSpeed);
    await setFanSpeed({speed: newSpeed});
    toast({
      title: "سرعت فن بروزرسانی شد.",
      description: `سرعت فن به ${newSpeed}% تنظیم شد.`,
    });
  };

  const handleLightStatusChange = async (checked: boolean) => {
    setLightStatusState(checked);
    await setLightStatus({isOn: checked});
    toast({
      title: "وضعیت چراغ بروزرسانی شد.",
      description: `چراغ ها ${checked ? 'روشن شدند' : 'خاموش شدند'}.`,
    });
  };

  const avgTemperature = historicalData.reduce((acc, data) => acc + data.temperature, 0) / historicalData.length;
  const avgHumidity = historicalData.reduce((acc, data) => acc + data.humidity, 0) / historicalData.length;
  const avgOxygen = historicalData.reduce((acc, data) => acc + data.oxygen, 0) / historicalData.length;


  return (
    <div className="flex flex-col p-4 gap-4 max-w-5xl md:max-w-5xl mx-auto">
      <Toaster/>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle> 📊 ECS</CardTitle>
            <CardDescription>سیستم کنترل محیطی</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatedBarChart value={avgTemperature} label="میانگین دما" color="hsl(var(--chart-1))"/>
          <AnimatedBarChart value={avgHumidity} label="میانگین رطوبت" color="hsl(var(--chart-2))"/>
          <AnimatedBarChart value={avgOxygen} label="میانگین اکسیژن" color="hsl(var(--chart-3))"/>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>

        <AccordionItem value="sensors">
          <AccordionTrigger> 🍃 سنسورها</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 🍃 سنسورها</CardTitle>
                <CardDescription>داده های لحظه ای سنسورها</CardDescription>
              </CardHeader>
              <CardContent>
                <Sensors temperature={temperature} humidity={humidity} oxygen={oxygen} lux={lux}/>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fan-lighting-control">
          <AccordionTrigger> ⚙️ کنترل فن و روشنایی</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle> ⚙️ کنترل سرعت فن</CardTitle>
                  <CardDescription>تنظیم سرعت فن به صورت دستی</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Slider
                      defaultValue={[fanSpeed]}
                      max={100}
                      step={1}
                      onValueChange={handleFanSpeedChange}
                    />
                    <p>سرعت کنونی: {fanSpeed}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle> 💡 کنترل روشنایی</CardTitle>
                  <CardDescription>روشن یا خاموش کردن چراغ ها از راه دور</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span>وضعیت چراغ ها: {lightStatus ? 'روشن' : 'خاموش'}</span>
                    <Switch checked={lightStatus} onCheckedChange={handleLightStatusChange}/>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>شدت نور: {lux} Lux</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai-optimization">
          <AccordionTrigger> 🤖 بهینه سازی مبتنی بر هوش مصنوعی</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 🤖 بهینه سازی مبتنی بر هوش مصنوعی</CardTitle>
                <CardDescription>توصیه هوش مصنوعی برای سرعت بهینه فن</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {aiRecommendation ? (
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary">سرعت فن پیشنهادی: {aiRecommendation.recommendedFanSpeed}%</Badge>
                    <p>{aiRecommendation.explanation}</p>
                  </div>
                ) : (
                  <p>در حال بارگیری توصیه هوش مصنوعی...</p>
                )}
                  {lightRecommendation ? (
                      <div className="flex flex-col gap-2">
                        <Badge variant="secondary">وضعیت نور پیشنهادی: {lightRecommendation.recommendedLightStatus ? 'روشن' : 'خاموش'}</Badge>
                        <p>{lightRecommendation.explanation}</p>
                      </div>
                  ) : (
                      <p>در حال بارگیری توصیه نور هوش مصنوعی...</p>
                  )}
                                <AIInteraction />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="camera-monitoring">
          <AccordionTrigger> 📷 نظارت دوربین</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 📷 نظارت دوربین</CardTitle>
                <CardDescription>فیدهای زنده دوربین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span>استفاده از دوربین:</span>
                  <Switch checked={useCamera} onCheckedChange={setUseCamera}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {useCamera && cameraFeeds.map((camera, index) => (
                    <div key={index} className="mb-4">
                      <p>دوربین {index + 1}</p>
                      <img src={camera} className="w-full aspect-video rounded-md" alt={`Camera ${index + 1}`} />
                    </div>
                  ))}
                </div>

                {useCamera && !(hasCameraPermission) && (
                  <Alert variant="destructive">
                    <AlertTitle>دسترسی به دوربین مورد نیاز است</AlertTitle>
                    <AlertDescription>
                      لطفاً برای استفاده از این ویژگی، دسترسی به دوربین را مجاز کنید.
                    </AlertDescription>
                  </Alert>
                )
                }
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="historical-data">
          <AccordionTrigger> 📈 تجسم داده های تاریخی</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 📈 تجسم داده های تاریخی</CardTitle>
                <CardDescription>نمایش بصری داده های سنسور در طول زمان</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full md:w-1/2">
                  <AreaChart data={historicalData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="time"/>
                    <YAxis/>
                    <Tooltip content={<ChartTooltipContent/>}/>
                    <Area type="monotone" dataKey="temperature" stroke={chartConfig.temperature.color} fillOpacity={0.5}
                          fill={chartConfig.temperature.color}/>
                    <Area type="monotone" dataKey="humidity" stroke={chartConfig.humidity.color} fillOpacity={0.5}
                          fill={chartConfig.humidity.color}/>
                    <Area type="monotone" dataKey="oxygen" stroke={chartConfig.oxygen.color} fillOpacity={0.5}
                          fill={chartConfig.oxygen.color}/>
                  </AreaChart>
                </ChartContainer>
                <Card className="w-full md:w-1/2">
                  <CardHeader>
                    <CardTitle>💡 ایده های مدیریتی از هوش مصنوعی</CardTitle>
                    <CardDescription>تجزیه و تحلیل هوش مصنوعی از داده های سنسور برای مدیریت مزرعه طیور</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>بر اساس داده های تاریخی، هوش مصنوعی پیشنهاد می کند:</p>
                    <ul>
                      <li>بهینه سازی برنامه های تغذیه در ساعات اوج دما.</li>
                      <li>تنظیم تهویه برای حفظ سطح رطوبت ثابت.</li>
                      <li>نظارت بر سطح اکسیژن در طول شب برای جلوگیری از هیپوکسی.</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
        <p className="text-center text-sm text-muted-foreground">طراحی‌و‌توسعه 🌍‌ ارسلان رضازاده</p>
    </div>
  );
}
