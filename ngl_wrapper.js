const anim_duration = 500

async function createNGLWrapper(container, params) {
    let wrapper = {}
    wrapper.stage = new NGL.Stage(container);
    wrapper.stage.setParameters( {
        backgroundColor: "white",
        "fogNear": 100,
        "fogFar": 100
    } );
    wrapper.buttons = []
    wrapper.components = {}
    async function makeComponent(struct) {
        cmp = await wrapper.stage.loadFile(struct.url)
        cmp.setName(struct['name'])
        if ('repr' in struct) {
            let repr_params = {}
            if ('repr_params' in struct) {
                repr_params = struct['repr_params']
            }
            cmp.addRepresentation(struct['repr'], repr_params)
        }
        wrapper.components[struct['name']] = cmp

    }
    for (let struct of params['structures']) {
        await makeComponent(struct)
    }
    wrapper.setDefaultView = function () {
        wrapper.stage.autoView()
    }
    if (params["scene_type"] === "compare") {
        for (let cmp_name in wrapper.components) {
            wrapper.buttons.push({
                "id": "ngl_toggle_"+cmp_name,
                "onclick": getToggleButton(wrapper.components[cmp_name])
            })
        }
    } else if (["fragment"].includes(params["scene_type"])) {
        wrapper.protein = wrapper.components['protein'];
        const selection = params.structures[0].selection;
        wrapper.setDefaultView = null
        wrapper.whole_repr = wrapper.protein.addRepresentation("cartoon", {color: '#888'})
        wrapper.chain_repr = wrapper.protein.addRepresentation("cartoon")
        if (selection.type === "motif") {
            wrapper.fragment_sele = `${selection.start}-${selection.end}:${selection.chain}`;
            wrapper.fragment_repr = wrapper.protein.addRepresentation("cartoon", {color: "green", opacity: 1});
            wrapper.fragment_repr.setSelection(wrapper.fragment_sele);
            wrapper.chain_sele = `:${selection.chain} and not (${selection.start + 1}-${selection.end - 1})`;
            wrapper.chain_repr.setParameters({color: '#AAA'})
            wrapper.whole_sele = `not :${selection.chain}`
            wrapper.setDefaultView = getShowPartiallyButton([wrapper.fragment_repr], [wrapper.chain_repr, wrapper.whole_repr], wrapper.protein, wrapper.fragment_sele)
        } else {
            wrapper.chain_sele = `:${selection.chain}`
            wrapper.chain_repr.setParameters({color: 'green'})
            wrapper.whole_sele = `not (${wrapper.chain_sele})`
            wrapper.setDefaultView = getShowPartiallyButton([wrapper.chain_repr], [wrapper.whole_repr], wrapper.protein, wrapper.chain_sele)
        }
        wrapper.chain_repr.setSelection(wrapper.chain_sele)
        wrapper.whole_repr.setSelection(wrapper.whole_sele)

        console.log(wrapper.fragment_sele)
        wrapper.buttons = [
            {
                "id": "ngl_focus_all_button",
                "onclick": getFocusOnAllButton(wrapper)
            },
            {
                "id": "ngl_focus_chain_button",
                "onclick": focusOnSelection(wrapper, wrapper.chain_sele)
            },

            {
                "id": "ngl_show_all_button",
                "onclick": getShowAllButton([wrapper.chain_repr, wrapper.whole_repr, wrapper.fragment_repr], wrapper.protein)
            },
            {
                "id": "ngl_show_chain_button",
                "onclick": getShowPartiallyButton([wrapper.chain_repr, wrapper.fragment_repr], [wrapper.whole_repr], wrapper.protein, wrapper.chain_sele)
            }
        ]
        if (selection.type === "motif") {
            wrapper.buttons.splice(2, 0, {
                "id": "ngl_focus_fragment_button",
                "onclick": focusOnSelection(wrapper, wrapper.fragment_sele)
            })
            wrapper.buttons.splice(5, 0, {
                "id": "ngl_show_fragment_button",
                "onclick": getShowPartiallyButton([wrapper.fragment_repr], [wrapper.chain_repr, wrapper.whole_repr], wrapper.protein, wrapper.fragment_sele)
            })
        }
    } else if (params["scene_type"] === "MD") {
        wrapper.protein = wrapper.components['protein'];
        let resp = await fetch(params.structures[0].trajectory.url)
        let data = await resp.blob()
        let file = new File([data], "md.xtc")
        let frames = await NGL.autoLoad(file)
        let trj = wrapper.protein.addTrajectory(frames)
        wrapper.player = new NGL.TrajectoryPlayer(trj.trajectory, {timeout: 200})
        wrapper.is_playing = false
        wrapper.buttons = [
            {
                "id": "ngl_toggle_md_playback",
                "onclick": function () {
                    if (wrapper.is_playing) {
                        wrapper.player.pause()
                        wrapper.is_playing = false
                    } else {
                        wrapper.player.play()
                        wrapper.is_playing = true
                    }
                }
            }
        ]
    }
    wrapper.setDefaultView()
    wrapper.drawCustomSelection = function (chain, start, end, repr_params, component) {
        if (!component) {
            if (!this.protein) {
                component = this.components[0]
            } else {
                component = this.protein
            }
        }
        if (!repr_params) {
            repr_params = {"color": "green"}
        }
        const sele_string = `${start}-${end}:${chain}`
        console.log(sele_string)
        if (!this.custom_selection) {
            this.custom_selection = component.addRepresentation("cartoon", repr_params)
        }
        this.custom_selection.setVisibility(true)
        //todo: add option to reset repr_params and change display type for selection
        this.custom_selection = this.custom_selection.setSelection(sele_string)
        this.chain_repr.setParameters({color: '#AAA', fogNear: 100, fogFar: 100})
        component.autoView(sele_string, anim_duration)
    }
    wrapper.cleanCustomSelection = function () {
        this.custom_selection.setVisibility(false)
        this.chain_repr.setParameters({color: 'green', fogNear: 100, fogFar: 100})
        this.setDefaultView()
    }
    return wrapper
}
function getToggleButton(component) {
    return function () {
        component.setVisibility(!component.visible)
    }
}

function focusOnSelection(wrapper, sele) {
    return function () {
        wrapper.protein.autoView(sele, anim_duration)
    }
}

function getFocusOnAllButton(wrapper) {
    return function () {
        console.log('focus all')
        wrapper.protein.autoView(anim_duration)
    }
}

function getShowAllButton(selections, protein) {
    return function() {
        for (let repr of selections) {
            if (repr !== undefined) {
                repr.setVisibility(true)
            }
        }
        protein.autoView(anim_duration)
    }
}
function getShowPartiallyButton(show_reprs, hide_reprs, protein, focus_sele) {
    return function () {
        for (let repr of hide_reprs) {
            if (repr !== undefined) {
                repr.setVisibility(false)
            }
        }
        for (let repr of show_reprs) {
            if (repr !== undefined) {
                repr.setVisibility(true)
            }
        }
        protein.autoView(focus_sele, anim_duration)
    }
}

async function initiateWrapper (root_elem, parameters, controls_translations) {
    let stage = root_elem.getElementsByClassName("ngl_stage")[0]
    let controls = root_elem.getElementsByClassName("ngl_controls")[0]
    let loader = root_elem.getElementsByClassName("ngl_loader")[0]
    let wrapper = await createNGLWrapper(stage, parameters)
    for (let butt of wrapper.buttons) {
        let button = document.createElement('button')
        button.setAttribute('className', butt['id'])
        button.addEventListener('click', butt['onclick'])
        button.innerText = ((butt['id'] in controls_translations) ? controls_translations[butt['id']]: butt['id'])
        controls.appendChild(button)
    }
    loader.style.display = 'none';
    return wrapper
}