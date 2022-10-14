import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toRecord } from '../../utils/sentences'

import { v4 as uuidv4 } from 'uuid';
import toWav from 'audiobuffer-to-wav';
import xhr from 'xhr';
import localforage from 'localforage'
import styles from './recorder.module.css';


import './record.css';

const audioType = 'audio/*';

let audioContext = new (window.AudioContext)()

let chunks = [];

const RecordItem = (props) => {

  const {savedRecordData, savedRecordIdx, deleteLine, recordLine} = props;
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [playState, setPlayState] = useState(false);

  const dataArray = savedRecordData.split("|");
  const speechTxt = dataArray[1];
  const speechWav = dataArray[0];

  useEffect(()=> {
    localforage.getItem(speechWav).then((blob) => {
      let audioBlobUrl = window.URL.createObjectURL(blob)
      let audioObj = new Audio(audioBlobUrl)
      setAudioPlayer(audioObj)
    }).catch((err) => {
      console.log("get audio blob from localforage is failed!", err, speechWav)
    })
  }, [])

  const playAudio = () => {
    if(audioPlayer) {
      audioPlayer.play()
      setPlayState(true)
      audioPlayer.addEventListener("ended", () => {
        setPlayState(false)
      });
    }
  }

  const stopAudio = () => {
    if(audioPlayer) {
      audioPlayer.stop()
      setPlayState(false)
    }
  }

  return (
    <li className='record-item'>
      <p className='record-txt'> {speechTxt} </p>
      <div className='btn-group'>
        {
          playState ?
          (<button onClick={stopAudio}>Stop</button>) :
          (<button onClick={playAudio}>Play</button>)
        }
        <button onClick={() => recordLine(savedRecordIdx)}>Rerecord</button>
        <button onClick={() => deleteLine(savedRecordIdx)}>Delete</button>
      </div>
    </li>
  );
}



const RecordBox = (props) => {

  const {isRerecord, setIsRererord, toRecordIdx, setRecordIdx, savedRecord, setSavedRecord, curSavedRecordIdx} = props
  const speakerID = uuidv4();
  const [audioDetails, setAudioDetails] = useState({
    url: null,
    blob: null
  });
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  let recordText = '';
  let audioID = '';

  if(isRerecord) {  // Rerecord case
    const savedRecordData = savedRecord[curSavedRecordIdx];
    const dataArray = savedRecordData.split("|");
    recordText = dataArray[1];
    const audioPrevId = dataArray[0];
    let temp = audioPrevId.split("-");
    audioID = speakerID + '-' + temp.pop()
  } else {  // new record case
    recordText = toRecord[toRecordIdx]
    audioID = speakerID + '-' + toRecordIdx
  }

  console.log("record status", recordText, audioID)

  async function initRecorder() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    if (navigator.mediaDevices) {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(newStream);
      setMediaRecorder(mediaRecorder);
      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      setStream(newStream);
      return mediaRecorder;
    }
  }

  async function startRecording(e) {
    e.preventDefault();
    handleReset();
    // wipe old data chunks
    chunks = [];

    const mediaRecorder = await initRecorder();
    // start recorder with 10ms buffer
    mediaRecorder.start(10);
    // say that we're recording
    setRecording(true);
  }

  function stopRecording(e) {
    e.preventDefault();
    // stop the recorder

    if (stream.getAudioTracks) {
      const tracks = stream.getAudioTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    } else {
      console.log('No Tracks Found')
    }

    mediaRecorder.stop();
    // say that we're not recording
    setRecording(false);
    // save the video to memory
    saveAudio();
  }

  function saveAudio() {
    // convert saved chunks to blob
    const blob = new Blob(chunks, { type: audioType });
    // generate video url from blob
    const audioURL = window.URL.createObjectURL(blob);
    // append videoURL to list of saved videos for rendering
    setAudioDetails({
      url: audioURL,
      blob: blob
    });
  }

  function downloadRecordings() {
    xhr({
      uri: audioDetails.url,
      responseType: 'arraybuffer'
    }, function (err, body, resp) {
      if (err) throw err

      let anchor = document.createElement('a')
      document.body.appendChild(anchor)
      anchor.style = 'display: none'

      audioContext.decodeAudioData(resp, function (buffer) {
        let wav = toWav(buffer)
        let blob = new window.Blob([new DataView(wav)], {
          type: 'audio/wav'
        })
        let audioID = speakerID + '-' + idx
        audioID = speakerID + '-' + toRecordIdx
      
        // save audio blob data to the localforage.
        localforage.setItem(audioID, blob).then((audioBlob) => {
          console.log("localforage blob save success", audioID, '---', audioBlob)
          let audioBlobUrl = window.URL.createObjectURL(audioBlob)
          anchor.href = audioBlobUrl
          anchor.download = audioID + '.wav'
          anchor.click()
          window.URL.revokeObjectURL(audioBlobUrl)
          setCsv(csv + (csv !== '' ? '\n' : '') + audioID + "|" + toRecord[toRecordIdx]);
  
          // Add new recorded data to the savedRecord array.
          if(!isRerecord) {
            let newSavedRecord = [...savedRecord, audioID + "|" + toRecord[toRecordIdx]];
            setSavedRecord(newSavedRecord);
            setIdx(idx + 1);
            setRecordIdx(toRecordIdx + 1);
            setCurRecordText(toRecord[toRecordIdx+1]);
          }
          setIsRererord(false)
          handleReset();
        }).catch((err) => {
          console.log("localforage blob save failed", err)
        })
      }
        , function () {
          throw new Error('Could not decode audio data.')
        })
    });
  }

  function handleReset() {
    const reset = {
      url: null,
      blob: null
    };
    chunks = [];
    setAudioDetails(reset);
  }

  return (
    <div className='record-box'>
      <div className='record-text'>
        <span> {recordText} </span>
      </div>

      <div className={styles.recorder_library_box}>
        <div className={styles.audio_section}>
          {
            audioDetails.url !== null ?
              (
                <audio controls>
                  <source src={audioDetails.url} type='audio/wav' />
                </audio>
              ) :
              null
          }
        </div>
        {
          !recording ?
            (
              <button
                onClick={e => startRecording(e)}
                href=' #'
                className={styles.mic_icon}
              >
              </button>
            ) :
            (
              <button
                onClick={e => stopRecording(e)}
                href=' #'
                className={`${styles.icons} ${styles.stop}`}
              >
              </button>
            )
        }
      </div>

      <div className="controls">
        <button disabled={!audioDetails.url} className="btn btn-save" onClick={downloadRecordings}>{'Save and Next'}</button>
      </div>
    </div>

  );
}

const Record = () => {

  const [idx, setIdx] = useState(0);
  const [csv, setCsv] = useState(localStorage.getItem('csv') || '');
  const [curSavedRecordIdx, setCurSavedRecordIdx] = useState(null)
  const [savedRecord, setSavedRecord] = useState([]);
  const [playUrl, setPlayUrl] = useState('');
  const [isRerecord, setIsRererord] = useState(false);
  const [curRecordText, setCurRecordText] = useState(toRecord[0]);

  function saveCsv() {
    const file = new window.Blob([csv], { type: 'text/plain' });
    const url = window.URL.createObjectURL(file)
    // download url
    const a = document.createElement('a')
    a.href = url
    a.download = 'metadata.csv'
    a.click()
    // revoke the url
    window.URL.revokeObjectURL(url)
  }

  function clearCsv() {
    setCsv('');
    localStorage.setItem('csv', '');
  }

  function deleteLine(savedRecordIdx) {
    let savedRecordArray = [...savedRecord]
    savedRecordArray.splice(savedRecordIdx, 1);
    setSavedRecord(savedRecordArray)
  }

  function recordLine(savedRecordIdx) {
    let savedRecordArray = [...savedRecord]
    let savedRecordData = savedRecordArray[savedRecordIdx]
    
    const dataArray = savedRecordData.split("|");
    const speechTxt = dataArray[1];
    const speechWav = dataArray[0];

    setCurSavedRecordIdx(savedRecordIdx)
    setIsRererord(true)
  
  }



  return (
    <div className='record-page'>
      <RecordBox isRerecord={isRerecord} setIsRererord={setIsRererord} toRecordIdx={idx} setRecordIdx={setIdx} 
        savedRecord={savedRecord} setSavedRecord={setSavedRecord} curSavedRecordIdx={curSavedRecordIdx}  />

      <div className='data-box'>
        <p className='record-title'>Recorded Speechlines</p>
        <ul className='record-list'>
        {
          savedRecord.map((value, i) => 
            <RecordItem key={i} savedRecordIdx={i} savedRecordData={value} deleteLine={deleteLine} recordLine={recordLine} />
          )
        }
        </ul>
      </div>
    </div>
  );

}

export default Record