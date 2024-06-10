import { useState, useRef, ChangeEvent } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Image, Undo2, CircleXIcon, CircleCheck } from 'lucide-react';
import * as yup from 'yup';

import { Appbar } from '@/components/Appbar';
import { Layout } from '@/layout';
import { ListTitle } from '../Main/components/ListTitle';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';

import { Button } from '@/components/ui/button';
import { IngredientFields } from './components/IngredientFields';
import { CookingOrderFields } from './components/CookingOrderFields';
import { Spinner } from '@/components/Spinner';

import { usePageMoveHandler } from '@/hooks/usePageMoveHandler';
import { useToast } from '@/hooks/useToast';

import { writeReciepePostFetch } from '@/api/reciepe/writeReciepePostFetch';

import { getReciepeCleansingData } from './util';

import { FOOD_CATEGORIES, COOK_TIME, PORTIONS, RECIEPE_TYPE } from './constants';
import { PATH } from '@/constants/paths';

import { reciepeSchema } from './validator';
import { isAxiosError } from 'axios';
import { TOAST } from '@/constants/toast';

export type ReciepeSchemaType = yup.InferType<typeof reciepeSchema>;

/**
 * 레시피 작성 페이지
 */
const ReciepeWrite = () => {
  const navigate = usePageMoveHandler();

  const { toast } = useToast();

  const [displaySpinner, setDisplaySpinner] = useState<boolean>(false);

  const method = useForm({
    resolver: yupResolver(reciepeSchema),
    defaultValues: {
      title: '',
      description: '',
      cuisine: '한식',
      reciepeType: '밥/죽/떡',
      reciepeTime: '15분',
      portions: '1인분',
      images: [
        {
          image: {} as File,
          imageUrl: '',
        },
      ],

      ingredients: [
        {
          name: '',
          quantity: '',
          unit: '',
        },
      ],

      details: [
        {
          image: {} as File,
          imageUrl: '',
          description: '',
        },
      ],
    },
  });

  const {
    handleSubmit: submit,
    control,
    watch,
    getValues,
    clearErrors,
    setValue,
    formState: { errors },
  } = method;

  const file = watch(`images.${0}`);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = () => {
    uploadRef.current?.click();

    clearErrors('images');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files = [] } = e.target;

    if (files && files.length > 0) {
      const uploadFile = files[0];

      setValue(`images.${0}.image`, uploadFile);

      const imageUrl = URL.createObjectURL(uploadFile);

      setValue(`images.${0}.imageUrl`, imageUrl);
    }
  };

  const handleSubmit = submit(async () => {
    try {
      setDisplaySpinner(true);

      const writeParams = await getReciepeCleansingData(getValues());

      const writeRes = await writeReciepePostFetch(writeParams);

      setDisplaySpinner(false);

      toast({
        title: writeRes.data.message || '레시피를 등록했어요!',
        icon: <CircleCheck />,
        className: TOAST.success,
      });

      navigate(PATH.receipe);
    } catch (error) {
      console.error(error);

      if (isAxiosError(error)) {
        setDisplaySpinner(false);

        toast({
          title: error?.response?.data.message || '레시피 등록에 실패했어요.',
          icon: <CircleXIcon />,
          className: TOAST.error,
        });
      }
    }
  });

  return (
    <>
      {displaySpinner ? <Spinner>레시피를 등록 중 이에요 ... </Spinner> : null}
      <Appbar />
      <Layout>
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => navigate(PATH.receipe)}>
          <Undo2 />
          <span className="text-xl">돌아갈래요</span>
        </Button>
        <div className="-mt-8">
          <ListTitle imgPath="/icons/receipe_icon.png" title="레시피 작성 중이에요 ..." />
        </div>
        <FormProvider {...method}>
          <div className="container w-11/12 mx-auto flex justify-between">
            <div className="basis-1/2">
              <div className="mt-8">
                <Input
                  control={control}
                  name="title"
                  type="text"
                  label="레시피 제목"
                  placeholder="레시피 제목을 입력해주세요."
                  error={errors?.title}
                />
              </div>
              <div className="mt-8">
                <Input
                  control={control}
                  name="description"
                  type="text"
                  label="간단한 한 줄 소개"
                  placeholder="간단한 한 줄 소개 20자 이내로 입력해주세요"
                  error={errors?.description}
                />
              </div>
              <div className="mt-8">
                <Select name="cuisine" id="cuisine" label="카테고리" options={FOOD_CATEGORIES} />
              </div>
              <div className="mt-8">
                <Select name="reciepeType" id="reciepeType" label="요리 유형" options={RECIEPE_TYPE} />
              </div>
              <div className="mt-8">
                <Select name="reciepeTime" id="reciepeTime" label="조리시간" options={COOK_TIME} />
              </div>
              <div className="mt-8">
                <Select name="portions" id="portions" label="👨🏿‍🦳인분" options={PORTIONS} />
              </div>
            </div>
            <div className="upload mt-8 basis-5/12">
              <div
                style={{
                  backgroundImage: file.imageUrl ? `url(${file.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                }}
                className={`group rounded-xl w-full h-full opacity-90 flex items-center justify-center ${
                  file && file instanceof File
                    ? `bg-cover bg-center bg-no-repeat border border-gray300`
                    : 'bg-[#f5f5f5]'
                }`}
              >
                <div className="flex flex-col justify-center items-center">
                  {file.imageUrl && file.image instanceof File ? null : (
                    <Image size={16} color={`${file.imageUrl ? '#2d3748' : '#a0aec0'}`} strokeWidth={1.25} />
                  )}
                  <Button
                    className={`flex gap-4 ${
                      file.imageUrl ? 'text-gray700 bg-white hidden group-hover:block' : 'text-gray400'
                    }`}
                    variant="ghost"
                    onClick={handleUploadImage}
                  >
                    대표이미지 {file.imageUrl && file.image instanceof File ? '수정' : '추가'}하기
                  </Button>
                </div>
              </div>
              {errors?.images?.[0]?.imageUrl ? (
                <p className="mt-2 text-sm text-red-600 text-left">{errors?.images?.[0]?.imageUrl.message}</p>
              ) : null}
              <input ref={uploadRef} className="hidden" accept="image/*" type="file" onChange={handleFileChange} />
            </div>
          </div>
          <div className="container w-11/12 mx-auto flex flex-col  mt-8">
            <ul>
              <li>재료정보</li>
              <li className="text-gray400 text-sm mt-2">
                재료가 남거나 부족하지 않도록 정확한 계량 정보를 적어주세요!
              </li>
            </ul>
            <div className="flex flex-col w-full justify-center">
              <IngredientFields />
            </div>
          </div>
          <div className="container w-11/12 mx-auto flex flex-col  mt-8 mb-20">
            <ul>
              <li>조리 순서</li>
              <li className="text-gray400 text-sm mt-2">이해를 돕기 위해 사진을 업로드해주세요! (선택사항)</li>
            </ul>
            <div className="flex flex-col w-full justify-center">
              <CookingOrderFields />
            </div>
          </div>
          <div className="w-fit mx-auto py-20">
            <Button className="rounded-lg w-24 text-lg" onClick={handleSubmit}>
              등록하기
            </Button>
          </div>
        </FormProvider>
      </Layout>
    </>
  );
};

export default ReciepeWrite;
