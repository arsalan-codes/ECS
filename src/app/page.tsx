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
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { useTheme } from 'next-themes';
import { siteConfig } from '@/config/site';
import { languages } from '@/config/i18n';
import {translations} from "@/lib/translate";
import {useRouter} from "next/navigation";

const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity (%)",
    color: "hsl(var(--chart-2))",
  },
  oxygen: {
    label: "Oxygen (%)",
    color: "hsl(var(--chart-3))",
  },
};

function Sensors({temperature, humidity, oxygen, lux, t}: { temperature: number, humidity: number, oxygen: number, lux: number, t: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.Sensors.temperatureTitle}</CardTitle>
          <CardDescription>{t.Sensors.temperatureDescription}</CardDescription>
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
          <CardTitle>{t.Sensors.humidityTitle}</CardTitle>
          <CardDescription>{t.Sensors.humidityDescription}</CardDescription>
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
          <CardTitle>{t.Sensors.oxygenTitle}</CardTitle>
          <CardDescription>{t.Sensors.oxygenDescription}</CardDescription>
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
            <CardTitle>{t.Sensors.lightIntensityTitle}</CardTitle>
            <CardDescription>{t.Sensors.lightIntensityDescription}</CardDescription>
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
    if (label.includes("Temperature")) return "°C";
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

const AIInteraction = ({t}: {t: any}) => {
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
      setAnswer(t.AI.errorResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 {t.AI.aiAssistant}</CardTitle>
        <CardDescription>{t.AI.aiDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          placeholder={t.AI.aiPlaceholder}
          value={question}
          onChange={handleQuestionChange}
          className="resize-none"
        />
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? t.AI.loading : t.AI.getAnswer}
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
    const [locale, setLocale] = useState('en');
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        // Set initial theme on mount (client-side)
        setTheme('dark');
    }, []);

    const router = useRouter();

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
          title: 'Camera access denied',
          description: 'Please enable camera access in your browser settings to use this feature.',
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
      title: 'Fan speed updated.',
      description: `Fan speed set to ${newSpeed}%.`,
    });
  };

  const handleLightStatusChange = async (checked: boolean) => {
    setLightStatusState(checked);
    await setLightStatus({isOn: checked});
    toast({
      title: 'Light status updated.',
      description: `Lights ${checked ? 'turned on' : 'off'}.`,
    });
  };

  const avgTemperature = historicalData.reduce((acc, data) => acc + data.temperature, 0) / historicalData.length;
  const avgHumidity = historicalData.reduce((acc, data) => acc + data.humidity, 0) / historicalData.length;
  const avgOxygen = historicalData.reduce((acc, data) => acc + data.oxygen, 0) / historicalData.length;

    const handleLocaleChange = (newLocale: string) => {
        setLocale(newLocale);

        router.push('/', { locale: newLocale });
  };

    const getDirection = () => {
        return locale === 'fa' ? 'rtl' : 'ltr';
    };

    const t = translations[locale as keyof typeof translations];


  return (
    <div className="flex flex-col p-4 gap-4 max-w-5xl md:max-w-5xl mx-auto" dir={getDirection()}>
      <Toaster/>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle> 📊 {t.Index.dashboardTitle}</CardTitle>
            <CardDescription>{t.Index.dashboardDescription}</CardDescription>
          </div>
            <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      🌐 {locale}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {languages.map((lang) => (
                      <DropdownMenuItem key={lang} onClick={() => handleLocaleChange(lang)}>
                        {lang}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? <Moon/> : <Sun/>}
              </Button>
            </div>
        </CardHeader>
        <CardContent className="flex flex-row gap-4">
          <AnimatedBarChart value={avgTemperature} label={t.Index.averageTemperature} color="hsl(var(--chart-1))"/>
          <AnimatedBarChart value={avgHumidity} label={t.Index.averageHumidity} color="hsl(var(--chart-2))"/>
          <AnimatedBarChart value={avgOxygen} label={t.Index.averageOxygen} color="hsl(var(--chart-3))"/>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="sensors">
          <AccordionTrigger> 🍃 {t.Index.sensorsSection}</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 🍃 {t.Index.sensorsTitle}</CardTitle>
                <CardDescription>{t.Index.sensorsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Sensors temperature={temperature} humidity={humidity} oxygen={oxygen} lux={lux} t={t}/>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fan-lighting-control">
          <AccordionTrigger> ⚙️ {t.Index.fanLightingControlSection}</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle> ⚙️ {t.Index.fanSpeedControlTitle}</CardTitle>
                  <CardDescription>{t.Index.fanSpeedControlDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Slider
                      defaultValue={[fanSpeed]}
                      max={100}
                      step={1}
                      onValueChange={handleFanSpeedChange}
                    />
                    <p>{t.Index.currentSpeed}: {fanSpeed}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle> 💡 {t.Index.lightingControlTitle}</CardTitle>
                  <CardDescription>{t.Index.lightingControlDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span>{t.Index.lightIntensity}: {lux} Lux</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Light status: {lightStatus ? 'on' : 'off'}</span>
                    <Switch checked={lightStatus} onCheckedChange={handleLightStatusChange}/>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai-optimization">
          <AccordionTrigger> 🤖 {t.Index.aiOptimizationSection}</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 🤖 {t.Index.aiOptimizationTitle}</CardTitle>
                <CardDescription>{t.Index.aiOptimizationDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {aiRecommendation ? (
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary">Recommended Fan Speed: {aiRecommendation.recommendedFanSpeed}%</Badge>
                    <p>{aiRecommendation.explanation}</p>
                  </div>
                ) : (
                  <p>{t.Index.loadingRecommendation}...</p>
                )}
                  {lightRecommendation ? (
                      <div className="flex flex-col gap-2">
                        <Badge variant="secondary">Recommended Light Status: {lightRecommendation.recommendedLightStatus ? 'on' : 'off'}</Badge>
                        <p>{lightRecommendation.explanation}</p>
                      </div>
                  ) : (
                      <p>{t.Index.loadingRecommendation}...</p>
                  )}
                  <AIInteraction t={t} />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="camera-monitoring">
          <AccordionTrigger> 📷 {t.Index.cameraMonitoringSection}</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 📷 {t.Index.cameraMonitoringTitle}</CardTitle>
                <CardDescription>{t.Index.cameraMonitoringDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span>{t.Index.useCamera}:</span>
                  <Switch checked={useCamera} onCheckedChange={setUseCamera}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {useCamera && cameraFeeds.map((camera, index) => (
                    <div key={index} className="mb-4">
                      <p>{t.Index.camera} {index + 1}</p>
                      <img src={camera} className="w-full aspect-video rounded-md" alt={`${t.Index.camera} ${index + 1}`} />
                    </div>
                  ))}
                </div>

                {useCamera && !(hasCameraPermission) && (
                  <Alert variant="destructive">
                    <AlertTitle>{t.Index.cameraAccessRequired}</AlertTitle>
                    <AlertDescription>
                      {t.Index.cameraAccessDescription}
                    </AlertDescription>
                  </Alert>
                )
                }
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="historical-data">
          <AccordionTrigger> 📈 {t.Index.historicalDataSection}</AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle> 📈 {t.Index.historicalDataTitle}</CardTitle>
                <CardDescription>{t.Index.historicalDataDescription}</CardDescription>
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
                    <CardTitle>💡 {t.Index.managementIdeasTitle}</CardTitle>
                    <CardDescription>{t.Index.managementIdeasDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{t.Index.aiSuggestion}</p>
                    <ul>
                      <li>{t.Index.suggestion1}</li>
                      <li>{t.Index.suggestion2}</li>
                      <li>{t.Index.suggestion3}</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
        <p className="text-center text-sm text-muted-foreground">Copyright © 2024 Arsalan Rezazadeh</p>
    </div>
  );
}
