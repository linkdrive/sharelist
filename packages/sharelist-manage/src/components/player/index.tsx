import Plyr from 'plyr'
import { ref, reactive, defineComponent, onMounted, onUnmounted, computed, watch, watchEffect } from 'vue'
import 'plyr/dist/plyr.css'
import './index.less'
import { OrderedListOutlined, CloseOutlined, FullscreenOutlined, DownloadOutlined, DownOutlined } from '@ant-design/icons-vue'
import { useBoolean, useState } from '@/hooks/useHooks'

const playerMap = new Map()
export const usePlayer = (id?: number | string): any => {
  if (id && playerMap.has(id)) {
    return playerMap.get(id)
  }

  const newId = id || playerMap.size + 1

  const removePlayer = () => playerMap.delete(id)

  const [state, setPlayer] = useState({
    list: [],
    type: '',
    index: 0,
    cur: { name: '', ctimeDisplay: '' },
  })

  const instance = {
    id: newId,
    data: state,
    setPlayer,
    removePlayer
  }

  playerMap.set(newId, instance)

  return instance
}

export default defineComponent({
  props: {
    meidaId: {
      type: String,
      required: true,
    },
  },

  setup(props, ctx) {
    const el = ref()

    const { data, removePlayer } = usePlayer(props.meidaId)

    const [visible, { setFalse: hidePlayer, setTrue: showPlayer }] = useBoolean()

    const [visibleList, { toggle: toggleList }] = useBoolean()

    const [fullscreen, { setFalse: existFullScreen, setTrue: enterFullScreen }] = useBoolean()

    const playerProgress = ref('0%')

    let player: any

    const onClose = () => {
      player.pause()
      hidePlayer()
      playerProgress.value = '0%'
    }

    const onSwitch = (idx: number) => {
      const file: any = data.list[idx]
      if (file) {
        showPlayer()
        data.index = idx
        playerProgress.value = '0%'

        //上传时间较短，预览地址可能尚未转码成功。
        let source = Date.now() - file.ctime > 15 * 60 * 1000 ? (file.preview_url || file.download_url) : file.download_url
        player.source = {
          type: data.type,
          title: file.name,
          sources: [{ src: source + "&t=" + Date.now(), size: 'Raw' }],
        }

        data.cur = { ...file }
        player.play().catch(() => { })
      }
    }

    const onFullScreen = () => {
      enterFullScreen()
      player.fullscreen.enter()
    }

    const onDownload = () => {
      window.open(data.cur.download_url)
    }

    const onProgress = (e: any) => {
      const plyr = e.detail.plyr
      if (plyr.currentTime && plyr.duration) {
        playerProgress.value = Math.floor((100 * plyr.currentTime) / plyr.duration) + '%'
      }
    }

    const onError = (e: any) => {
      console.log(e)
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

    onMounted(() => {
      player = new Plyr(el.value, {
        fullscreen: { enabled: true, fallback: true, iosNative: isIOS, container: undefined },
      })
      player.on('exitfullscreen', existFullScreen)
      player.on('timeupdate', onProgress)
      player.on('error', onError)
    })

    onUnmounted(() => {
      removePlayer()
    })

    watchEffect(() => {
      onSwitch(data.index)
    })

    return () => (
      <div class={['widget-player', visible.value ? 'widget-player--visible' : null]}>
        <div
          class={['widget-player-wrap', 'widget-player-' + data.type, !fullscreen.value ? 'widget-player--mini' : null]}
        >
          <div class={['widget-player__list', visibleList.value ? 'widget-player__list--visible' : null]}>
            <div class="widget-player__list-header" onClick={toggleList}>播放列表</div>
            <ul class="widget-player__list-body">
              {data.list.map((i: any, idx: number) => {
                return (
                  <li
                    class={['widget-player__list-item', data.index == idx ? 'widget-player__list-item--playing' : null]}
                    onClick={() => onSwitch(idx)}
                  >
                    <div class="widget-player__list-no">{idx + 1}.</div>
                    <div>
                      <div>{i.name}</div>
                      <div class="widget-player__tip">{i.ctimeDisplay}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          <div class={'widget-player__body'}>
            <video ref={el}></video>
            <div class="widget-player__content" title={data.cur.name} onClick={onFullScreen}>
              <div class="widget-player__content-title">{data.cur.name}</div>
              <div class="widget-player__tip">{data.cur.ctimeDisplay}</div>
            </div>
            <div class="widget-player__action">
              <DownloadOutlined onClick={onDownload} class="widget-player__download" />
              <OrderedListOutlined onClick={toggleList} class="widget-player__toggle-expand" />
              <FullscreenOutlined class="widget-player__btn-full" onClick={onFullScreen} />
              <CloseOutlined onClick={onClose} class="widget-player__close" />
            </div>
            <div class="widget-player__progress" style={{ width: playerProgress.value }}></div>
          </div>
        </div>
      </div>
    )
  },
})
