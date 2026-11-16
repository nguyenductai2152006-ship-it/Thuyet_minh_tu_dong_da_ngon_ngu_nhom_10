// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import App from "../App";
import {trackAnalytics} from "../api/analytics";

const state=vi.hoisted(()=>({geo:null}));
vi.mock("../hooks/useGeoNarration",()=>({useGeoNarration:options=>{state.geo=options;return {status:"GPS",enabled:true,stop:vi.fn(),retry:vi.fn()};}}));
vi.mock("../api/analytics",()=>({trackAnalytics:vi.fn()}));
vi.mock("../api/api",()=>({getAllPois:vi.fn(async()=>[{id:3,name:"POI",qrCode:"QR3",status:"ACTIVE"}]),getPoiByQrCode:vi.fn(async()=>({id:3,name:"POI",description:"Mô tả",qrCode:"QR3"})),getLocalization:vi.fn(async()=>({localizedName:"POI",localizedDescription:"Nội dung"})),getAudio:vi.fn(async()=>({audioUrl:"/audio/3-vi.mp3"})),getCurrentUser:vi.fn(),logout:vi.fn()}));
vi.mock("../components/ExploreLanding",()=>({default:()=>null}));
vi.mock("../components/QrScanner",()=>({default:()=>null}));
vi.mock("../components/InteractiveMap",()=>({default:({gpsPosition})=><output data-testid="gps">{JSON.stringify(gpsPosition)}</output>}));
vi.mock("../components/AudioPlayerCard",()=>({default:({analyticsSource,onSpeak})=><><output data-testid="source">{analyticsSource}</output><button onClick={onSpeak}>Read TTS</button></>}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel:vi.fn(),getVoices:()=>[],speak:utterance=>utterance.onstart()}});vi.stubGlobal("SpeechSynthesisUtterance",class{constructor(text){this.text=text;}});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("passes GPS accuracy from the watcher to the map",async()=>{render(<App/>);await waitFor(()=>expect(state.geo).toBeTruthy());act(()=>state.geo.onPosition({latitude:15,longitude:108,accuracy:17}));fireEvent.click(screen.getByRole("button",{name:"Bản đồ"}));expect(JSON.parse((await screen.findByTestId("gps")).textContent)).toEqual({latitude:15,longitude:108,accuracy:17});});
it("preserves browser-test context for both the recording and manual TTS",async()=>{render(<App/>);fireEvent.click(await screen.findByRole("button",{name:"POI 3"}));await waitFor(()=>expect(screen.getByTestId("source").textContent).toBe("browser-test"));fireEvent.click(screen.getByRole("button",{name:"Read TTS"}));expect(trackAnalytics).toHaveBeenCalledWith("audio_play",{poiId:3,source:"browser-test"});});
