$('body').on('EDGE_Recurso_promiseCreated', function(evt)
{
    ed_send_data(evt.sym);
});

function ed_send_data(sym)
{    
    $('<link rel="stylesheet" href="bootstrap.min.css">').appendTo("head");
    $('<link rel="stylesheet" href="bootstrap-select.css">').appendTo("head");
    
    $.getJSON('config.json', function (json_content) {

        var stage = $(sym.getComposition().getStage().ele);
        stage.prop('ed_json_property_object', json_content);
        stage.prop('ed_user_attempts', json_content.attempts);

        $.each(json_content.selecciones_a_elegir, function (key, json_select_object) {
            var element = $("<select/>");
            element.css(stage.prop('ed_json_property_object').css_config_select);
            element.css({
                width: 8
               // height: sym.$('text_' + key).css("height")
            });

            var option = $("<option/>", {value: ""});
            option.text(json_select_object.text_default);
            //option.css(stage.prop('ed_json_property_object').css_config_option);

            element.append(option);

            for (var i = 0; i < json_select_object.opciones.length; i++)
            {
                var option = $("<option/>", {value: json_select_object.opciones[i].valor});
                option.text(json_select_object.opciones[i].opcion);
                //option.css(stage.prop('ed_json_property_object').css_config_option);
                element.append(option);
                //element.append('<option value="'+json_select_object.opciones[i].valor+'">'+json_select_object.opciones[i].opcion+'</option>');
            }
            sym.$('text_' + key).append(element);
        });
        $('<style type="text/css">.dropdown-menu{ font-size:'+stage.prop('ed_json_property_object').other_css.tamano+'; font-family: '+stage.prop('ed_json_property_object').other_css.fuente+'; letter-spacing: 3px;} .btn{font-size: '+stage.prop('ed_json_property_object').other_css.tamano+'; letter-spacing: 3px; padding-left: 20%}</style>').appendTo("head");

        $('select').selectpicker({
            style: "myclass",
            width: stage.prop('ed_json_property_object').other_css.ancho,
            size: 10
        });

        $("select").change(function()
            {
                send_on_change(sym);
            });

        parent.$(parent.document).trigger({
            type: 'EDGE_Plantilla_creationComplete',
            sym: sym,
            identify: stage.prop("ed_identify")
        });

        if(sym.$("Submit").length>0)
        {
            sym.getSymbol("Submit").playReverse("desactivado");           
        }

        stage.prop('ed_blocked',true);
    });
}

function send_on_change(sym)
{
    var stage = $(sym.getComposition().getStage().ele);
    parent.$(parent.document).trigger(
    {
        type: "EDGE_Plantilla_onChange",
        sym: sym,
        identify: stage.prop("ed_identify")
    });

    var stage = $(sym.getComposition().getStage().ele);
    var json_stage = stage.prop("ed_json_property_object");
    var activity_score = 0;
    var retorno_datos = {};
    retorno_datos.json_object = json_stage;
    retorno_datos.user_answer = [];
    retorno_datos.position_which_is_right = [];
    retorno_datos.correct_answers = json_stage.selecciones_a_elegir;
    retorno_datos.attempts_to = stage.prop('ed_user_attempts');
    retorno_datos.isReady = true;

    var i = 0;
    $.each(json_stage.selecciones_a_elegir, function (key, json_select_object) {
        retorno_datos.user_answer[i] = sym.$('text_' + key).find('select').val();
        if (sym.$('text_' + key).find('select').val() === json_select_object.valor_correcto) {
            retorno_datos.position_which_is_right[i] = true;
            retorno_datos.final_stage = "correct";
        } else {
            retorno_datos.position_which_is_right[i] = false;
            retorno_datos.final_stage = "incorrect";
        }
        i++;
    });
    for (var j = 0; j <= i; j++)
    {
        if(retorno_datos.user_answer.length == i)
        {
            if(retorno_datos.user_answer[j] == "")
            {
                retorno_datos.isReady = false;
                break;
            }
        }
    };

    if(retorno_datos.isReady == true)
    {
        if(sym.$("Submit").length>0)
        {
            sym.getSymbol("Submit").play("activado");
        }

        stage.prop('ed_blocked',false);        
    }
    else
    {
        if(sym.$("Submit").length>0)
        {
            sym.getSymbol("Submit").playReverse("desactivado");
        }

        stage.prop('ed_blocked',false);
    }

    var ed_obj_evt = 
    {
        type: "EDGE_Plantilla_onChange",
        interactionType: "fill-in",
        json: retorno_datos.json_object,
        answer: retorno_datos.user_answer,
        isReady: retorno_datos.isReady,
        results: retorno_datos.final_stage,
        position_which_is_right: retorno_datos.position_which_is_right,
        attempts: retorno_datos.attempts_to,
        attempts_limit: retorno_datos.json_object.attempts,
        sym: sym,
        identify: stage.prop("ed_identify")
    };
    parent.$(parent.document).trigger(ed_obj_evt);
}

$('body').on("EDGE_Plantilla_creationComplete", function (evt) {

    /*$('body').trigger({
        type: "EDGE_Recurso_sendPreviousData",
        submit_block: "desactivado",
        sym: evt.sym,
        identify: {}
    });*/
});

$('body').on('EDGE_Recurso_sendPreviousData EDGE_Recurso_postSubmitApplied EDGE_Recurso_onChange', function (evt) {
    var stage = $(evt.sym.getComposition().getStage().ele);
    if(typeof (evt.previous_data) !== "undefined") {
        for (var i = evt.previous_data.length - 1; i >= 0; i--)
        {
            evt.sym.$('text_' + (i + 1)).find('select option[value=' + evt.previous_data[i] + ']').attr('selected', 'selected');
        }
    }

    if(evt.block) 
    {
        //Debe bloquear la actividad
        stage.prop('ed_blocked', true);
        block_every_select(evt.sym);
    }
    if(typeof (evt.attempts) !== "undefined") {
        stage.prop('ed_user_attempts', evt.attempts);
    }

    if(evt.show_answers)
    {
        show_correct_answers(evt.sym);
    }

    switch(evt.submit_block)
    {
        case "desactivado":
            try
            {
                if(sym.$("Submit").length>0)
                {
                    evt.sym.getSymbol("Submit").playReverse("desactivado");                    
                }

                stage.prop('ed_blocked',true);
            }
            catch(err)
            {
                //console.log(err);
            }            
            break;
        case "activado":          
            try
            {
                if(sym.$("Submit").length>0)
                {
                    evt.sym.getSymbol("Submit").play("activado");
                }

                stage.prop('ed_blocked',false);
            }
            catch(err)
            {
                //alert(err);
            }
            break;
        default:          
            console.error("Está en default");
    }

});

function show_correct_answers(sym)
{
    var json_stage = $(sym.getComposition().getStage().ele).prop('ed_json_property_object');

    $.each(json_stage.selecciones_a_elegir, function (key, json_select_object)
    {
        sym.$('text_' + key).find('select option[value=' + json_select_object.valor_correcto + ']').attr('selected', 'selected');
    });
}

function block_every_select(sym)
{
    var json_stage = $(sym.getComposition().getStage().ele).prop('ed_json_property_object');
    var arrays = json_stage.palabras_a_escribir;

    $.each(json_stage.selecciones_a_elegir, function (key, json_select_object) {
        sym.$('text_' + key).find('select option').prop('disabled', false);
        sym.$('text_' + key).find('select option').attr('disabled', 'disabled');
    });
}

function EDGE_Recurso_Submit(sym)
{
    $('body').trigger({
        type: 'EDGE_Recurso_Submit',
        sym: sym
    });
}

$('body').on('EDGE_Recurso_Submit', function (evt) {
    do_submit(evt.sym);
});

function do_submit(sym)
{
    if(sym.$("Submit").length>0)
    {
        sym.getSymbol("Submit").playReverse("desactivado");                    
    }

    var stage = $(sym.getComposition().getStage().ele);
    var json_stage = stage.prop("ed_json_property_object");
    var activity_score = 0;
    var retorno_datos = {};
    retorno_datos.json_object = json_stage;
    retorno_datos.user_answer = [];
    retorno_datos.position_which_is_right = [];
    retorno_datos.correct_answers = json_stage.selecciones_a_elegir;
    retorno_datos.attempts_to = stage.prop('ed_user_attempts');
    retorno_datos.isReady = true;

    if (stage.prop('ed_blocked')) {
        return;
    }
    
    var i = 0;
    $.each(json_stage.selecciones_a_elegir, function (key, json_select_object) {
        retorno_datos.user_answer[i] = sym.$('text_' + key).find('select').val();
        if (sym.$('text_' + key).find('select').val() === json_select_object.valor_correcto) {
            retorno_datos.position_which_is_right[i] = true;
            retorno_datos.final_stage = "correct";
        } else {
            retorno_datos.position_which_is_right[i] = false;
            retorno_datos.final_stage = "incorrect";
        }
        i++;
    });

    var ed_obj_evt =
    {
        type: "EDGE_Plantilla_submitApplied",
        interactionType: "fill-in",
        json: retorno_datos.json_object,
        answer: retorno_datos.user_answer,
        results: retorno_datos.final_stage,
        position_which_is_right: retorno_datos.position_which_is_right,
        attempts: retorno_datos.attempts_to,
        attempts_limit: retorno_datos.json_object.attempts,
        sym: sym,
        identify: stage.prop("ed_identify")
    };
    //console.log(retorno_datos);
    parent.$(parent.document).trigger(ed_obj_evt);

    return retorno_datos;
}