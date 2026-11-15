"""
ViralClip AI - Curated Viral Video Presets
High-retention, funny, and viral clips with real speech audio and studio visuals.
"""

import os
from typing import List, Dict, Any, Optional
from .viral_analyzer import build_viral_clip_object

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

SAMPLE_VIDEOS: List[Dict[str, Any]] = [
    {
        "id": "ycPr5-FLMQg",
        "title": "Joe Rogan Experience #1169 - Elon Musk",
        "channel": "PowerfulJRE",
        "duration_str": "2:37:02",
        "views": "68M views",
        "thumbnail": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
        "source_file": os.path.join(ASSETS_DIR, "elon_clip.mp4"),
        "video_url": "/assets/elon_clip.mp4",
        "description": "Elon Musk discusses artificial intelligence, simulation theory, neuralink, and the future of humanity.",
        "category": "hook",
        "clips": [
            build_viral_clip_object(
                clip_id="elon_simulation_01",
                title_hook="When Elon Musk Realized Reality Is A Simulation",
                hook_banner="HE REALLY SAID THIS ON LIVE PODCAST... 🤯",
                transcript_segment="The argument for simulation is actually quite strong. If you assume any rate of improvement at all, games will become indistinguishable from reality. Either games will become indistinguishable from reality, or civilization will cease to exist. Those are the two options. Therefore, we are most likely in a simulation.",
                start_sec=0.0,
                end_sec=22.0,
                category="hook",
                custom_score=98
            ),
            build_viral_clip_object(
                clip_id="elon_laugh_02",
                title_hook="Elon Musk Unhinged Response To Electric Airplanes",
                hook_banner="JOE ROGAN COULD NOT STOP LAUGHING 😂💀",
                transcript_segment="An electric plane is not that hard, you just have to do vertical takeoff and landing, supersonic at high altitude. The trick is that you have to transition to level flight. The fun thing about electric is you can do things that are physically impossible with jet engines.",
                start_sec=0.0,
                end_sec=22.0,
                category="funny",
                custom_score=95
            ),
            build_viral_clip_object(
                clip_id="elon_wisdom_03",
                title_hook="Elon Musk 1 Rule For Young People Trying To Get Rich",
                hook_banner="THIS 30-SECOND ADVICE IS WORTH MILLIONS 💰📈",
                transcript_segment="Focus on signal over noise. A lot of companies get confused. They spend money on things that don't actually make the product better. Are people happier with the product? If not, stop doing it. Work super hard. Every waking hour.",
                start_sec=0.0,
                end_sec=22.0,
                category="money",
                custom_score=97
            )
        ]
    },
    {
        "id": "kYfNvmF0Bqw",
        "title": "Andrew Schulz - Crowd Heckler Gets Completely Destroyed",
        "channel": "Andrew Schulz Comedy",
        "duration_str": "14:22",
        "views": "14M views",
        "thumbnail": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80",
        "source_file": os.path.join(ASSETS_DIR, "schulz_clip.mp4"),
        "video_url": "/assets/schulz_clip.mp4",
        "description": "Standup comedian Andrew Schulz turns a loud heckler into the joke of the night.",
        "category": "funny",
        "clips": [
            build_viral_clip_object(
                clip_id="schulz_roast_01",
                title_hook="Comedian Destroys Heckler in 5 Seconds Flat",
                hook_banner="WATCH HIS SMILE INSTANTLY VANISH 💀😭",
                transcript_segment="You bought front row tickets to tell me how to do my job? Bro you look like you got fired from an unpaid internship! Look at his haircut, that is not a fade, that is a cry for help! Everyone look at him right now, he is rethinking his entire life choices!",
                start_sec=0.0,
                end_sec=20.0,
                category="funny",
                custom_score=99
            ),
            build_viral_clip_object(
                clip_id="schulz_punchline_02",
                title_hook="The Funniest Comeback In Stand Up Comedy History",
                hook_banner="THE ENTIRE ROOM BURST INTO TEARS 😂🤣",
                transcript_segment="Wait wait wait, did you just say you work in crypto? No wonder you are sitting here yelling at 9 PM on a Tuesday, your portfolio is down ninety-eight percent! Give this man a hug before he asks for his ticket refund in Dogecoin!",
                start_sec=0.0,
                end_sec=20.0,
                category="funny",
                custom_score=97
            )
        ]
    },
    {
        "id": "0e3GPea1Tyg",
        "title": "MrBeast - $456,000 Squid Game In Real Life!",
        "channel": "MrBeast",
        "duration_str": "25:41",
        "views": "600M views",
        "thumbnail": "https://i.ytimg.com/vi/0e3GPea1Tyg/maxresdefault.jpg",
        "source_file": os.path.join(ASSETS_DIR, "mrbeast_clip.mp4"),
        "video_url": "/assets/mrbeast_clip.mp4",
        "description": "MrBeast recreates Squid Game in real life with 456 players for $456,000.",
        "category": "funny",
        "clips": [
            {
                "clip_id": "mrbeast_squid_01",
                "title": "MRBEAST RED LIGHT GREEN LIGHT TENSION 😂💀 #Shorts",
                "raw_title": "MrBeast Recreates Real Squid Game For $456,000",
                "hook_banner": "RED LIGHT... GREEN LIGHT! 💀🦑",
                "category": "funny",
                "start_time": 0.0,
                "end_time": 30.0,
                "duration": 30.0,
                "virality_score": 99,
                "hook_grade": "A+ (Viral Elite)",
                "retention_prediction": "128% (High Looping)",
                "transcript": "Going this guy is doing a full squat green light green light oh they all stop red light oh I caught it oh no you push my glasses up okay do it slowly though be careful okay are you good yeah perfect green light red light oh you are still moving she was jogging over here we are gonna go see who is in the very back you are in dead last whats going on I will let the others clear the path for me",
                "hashtags": ["#Shorts", "#viral", "#mrbeast", "#squidgame", "#challenge", "#funny", "#trending"],
                "seo_description": "MrBeast Squid Game Red Light Green Light real life challenge! Don't forget to like and subscribe for daily viral shorts. #Shorts #mrbeast #squidgame",
                "monetization": {
                    "niche": "Entertainment / Viral Challenge",
                    "potential_rpm": "$0.06 - $0.12 per 1K Views",
                    "monetization_angles": ["YouTube Shorts Fund / Partner Program", "Pinned Merch Storefront"],
                    "recommended_schedule": "Post 3x daily"
                },
                "subtitles": [
                    {"id": 1, "start": 0.24, "end": 0.8, "text": "LIGHT GOING THIS"},
                    {"id": 2, "start": 0.8, "end": 1.44, "text": "GUYS DOING A"},
                    {"id": 3, "start": 1.44, "end": 2.72, "text": "FULL SQUAT GREEN"},
                    {"id": 4, "start": 2.72, "end": 4.72, "text": "LIGHT GREEN LIGHT"},
                    {"id": 5, "start": 4.72, "end": 5.28, "text": "OH THEY ALL"},
                    {"id": 6, "start": 5.28, "end": 7.44, "text": "STOP RED LIGHT"},
                    {"id": 7, "start": 7.44, "end": 8.4, "text": "OH I CAUGHT"},
                    {"id": 8, "start": 8.4, "end": 11.12, "text": "IT OH NO"},
                    {"id": 9, "start": 11.12, "end": 11.6, "text": "YOU PUSH MY"},
                    {"id": 10, "start": 11.6, "end": 12.8, "text": "GLASSES UP OKAY"},
                    {"id": 11, "start": 12.8, "end": 13.52, "text": "DO IT SLOWLY"},
                    {"id": 12, "start": 13.52, "end": 14.64, "text": "THOUGH BE CAREFUL"},
                    {"id": 13, "start": 14.64, "end": 15.2, "text": "OKAY ARE YOU"},
                    {"id": 14, "start": 15.2, "end": 16.24, "text": "GOOD YEAH PERFECT"},
                    {"id": 15, "start": 16.24, "end": 18.8, "text": "GREEN LIGHT RED"},
                    {"id": 16, "start": 18.8, "end": 20.96, "text": "LIGHT OH YOURE"},
                    {"id": 17, "start": 20.96, "end": 22.24, "text": "STILL MOVING SHE"},
                    {"id": 18, "start": 22.24, "end": 23.36, "text": "WAS JOGGING OVER"},
                    {"id": 19, "start": 23.36, "end": 23.92, "text": "HERE WERE GONNA"},
                    {"id": 20, "start": 23.92, "end": 24.56, "text": "GO SEE WHOS"},
                    {"id": 21, "start": 24.56, "end": 24.96, "text": "IN THE VERY"},
                    {"id": 22, "start": 24.96, "end": 25.76, "text": "BACK YOU ARE"},
                    {"id": 23, "start": 25.76, "end": 26.96, "text": "IN DEAD LAST"},
                    {"id": 24, "start": 26.96, "end": 27.84, "text": "WHATS GOING ON"},
                    {"id": 25, "start": 27.84, "end": 28.24, "text": "ILL LET THE"},
                    {"id": 26, "start": 28.24, "end": 28.88, "text": "OTHERS CLEAR THE"},
                    {"id": 27, "start": 28.88, "end": 29.68, "text": "PATH FOR ME"},
                    {"id": 28, "start": 29.68, "end": 30.0, "text": "YOU LITERALLY"}
                ]
            }
        ]
    },
    {
        "id": "UF8uR6Z6KLc",
        "title": "Steve Jobs - 2005 Stanford Commencement Speech",
        "channel": "Stanford University",
        "duration_str": "15:04",
        "views": "42M views",
        "thumbnail": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
        "source_file": os.path.join(ASSETS_DIR, "jobs_clip.mp4"),
        "video_url": "/assets/jobs_clip.mp4",
        "description": "Steve Jobs urges us to pursue our dreams and see the opportunities in life's setbacks.",
        "category": "wisdom",
        "clips": [
            build_viral_clip_object(
                clip_id="jobs_dots_01",
                title_hook="Steve Jobs - You Can Only Connect The Dots Looking Back",
                hook_banner="THIS 30 SECONDS WILL CHANGE YOUR PERSPECTIVE ✨🧠",
                transcript_segment="You cannot connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. Have the courage to follow your heart and intuition. Stay hungry, stay foolish.",
                start_sec=0.0,
                end_sec=16.0,
                category="wisdom",
                custom_score=99
            ),
            build_viral_clip_object(
                clip_id="jobs_foolish_02",
                title_hook="Stay Hungry, Stay Foolish - The Ultimate Rule",
                hook_banner="THE GREATEST MOTIVATIONAL SHORT EVER 🚀🔥",
                transcript_segment="Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma, which is living with the results of other people's thinking. Have the courage to follow your heart and intuition. Stay hungry, stay foolish.",
                start_sec=0.0,
                end_sec=16.0,
                category="wisdom",
                custom_score=97
            )
        ]
    }
]


def get_sample_by_id_or_url(query: str) -> Optional[Dict[str, Any]]:
    """Finds a matching sample video by ID, URL, or keywords."""
    if not query:
        return None
    query_lower = query.lower()
    for sample in SAMPLE_VIDEOS:
        if sample["id"] in query or sample["id"].lower() == query_lower:
            return sample
        if any(term in sample["title"].lower() for term in ["elon", "rogan"]) and any(term in query_lower for term in ["elon", "rogan", "simulation"]):
            return sample
        if any(term in sample["title"].lower() for term in ["schulz", "comedy"]) and any(term in query_lower for term in ["schulz", "heckler", "roast", "comedy"]):
            return sample
        if any(term in sample["title"].lower() for term in ["mrbeast"]) and "mrbeast" in query_lower:
            return sample
        if any(term in sample["title"].lower() for term in ["steve jobs", "stanford"]) and any(term in query_lower for term in ["steve", "jobs", "stanford"]):
            return sample
    return None
